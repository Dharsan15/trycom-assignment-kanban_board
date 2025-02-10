import { useState, useEffect } from 'react';
import type { Task, Column as ColumnType } from './utils/type';
import { Column } from './components/Column';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { FaSun, FaMoon } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const COLUMNS: ColumnType[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
];

async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('https://trycom-assignment-kanban-board-backend-2.onrender.com/api/tasks/gettasks');
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

async function addTaskToDB(task: Task) {
  const response = await fetch('https://trycom-assignment-kanban-board-backend-2.onrender.com/api/tasks/addtasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to add task');
  return response.json();
}

async function updateTaskStatusInDB(task: Task): Promise<Task> {
  const response = await fetch(`https://trycom-assignment-kanban-board-backend-2.onrender.com/api/tasks/updatetask/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: task.status }),
  });
  if (!response.ok) throw new Error('Failed to update task status');
  return response.json();
}

async function deleteTaskStatusInDB(task: Task): Promise<Task> {
  const response = await fetch(`https://trycom-assignment-kanban-board-backend-2.onrender.com/api/tasks/deletetask/${task.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) throw new Error('Failed to delete task');
  return response.json();
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const addTaskMutation = useMutation({
    mutationFn: addTaskToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTaskStatusInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Enable mobile-friendly drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor), // For mouse
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Prevents accidental drag
        tolerance: 5, // Small movement before activating
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    const task = tasks.find((task) => task.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, status: newStatus };
    updateTaskMutation.mutate(updatedTask);
  }

  function addTask(title: string, description: string, columnId: string) {
    if (!title.trim() || !description.trim()) return;
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      status: columnId as Task['status'],
    };
    addTaskMutation.mutate(newTask);
  }

  if (isLoading) return <p>Loading tasks...</p>;
  if (error) return <p>Error loading tasks</p>;

  return (
    <div className={`w-full h-screen transition-all ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} overflow-y-auto`}>
      <div className='text-center text-3xl font-bold pt-10 flex justify-between items-center px-6'>
        <span>Kanban Board</span>
        <button onClick={() => setDarkMode(!darkMode)} className='text-2xl'>
          {darkMode ? <FaSun className='text-yellow-400' /> : <FaMoon className='text-gray-700' />}
        </button>
      </div>

      <div className='flex flex-col items-center mt-6 p-4'>
        <div className='flex flex-col md:flex-row gap-4 mb-6'>
          <input type='text' placeholder='Task title' className='p-2 border rounded-md text-black' id='taskTitle' />
          <input type='text' placeholder='Task description' className='p-2 border rounded-md text-black' id='taskDesc' />
          <select className='p-2 border rounded-md text-black' id='taskColumn'>
            {COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>{column.title}</option>
            ))}
          </select>
          <button
            onClick={() =>
              addTask(
                (document.getElementById('taskTitle') as HTMLInputElement).value,
                (document.getElementById('taskDesc') as HTMLInputElement).value,
                (document.getElementById('taskColumn') as HTMLSelectElement).value
              )
            }
            className='p-2 bg-blue-500 text-white rounded-md'
          >
            Add Task
          </button>
        </div>
      </div>

      <div className='flex flex-wrap justify-center mt-4 p-4 gap-4'>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {COLUMNS.map((column) => (
            <Column
              darkMode={darkMode}
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.status === column.id)}
              deleteTaskStatusInDB={deleteTaskStatusInDB}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
