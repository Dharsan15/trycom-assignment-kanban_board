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

const API_BASE_URL = 'http://localhost:8000/api/tasks';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]); 
  const queryClient = useQueryClient();

 const { data: fetchedTasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/gettasks`);
      return res.json();
    },
    onSuccess : (data) => {
      setLocalTasks(data);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await fetch(`${API_BASE_URL}/addtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await fetch(`${API_BASE_URL}/updatetask/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: task.status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      await fetch(`${API_BASE_URL}/deletetask/${task.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  useEffect(() => {
    if (fetchedTasks.length > 0) {
      setLocalTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    const task = localTasks.find((task) => task.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, status: newStatus };

    setLocalTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
    );

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

    setLocalTasks((prevTasks) => [...prevTasks, newTask]);

    addTaskMutation.mutate(newTask);
  }

  function deleteTask(task: Task) {
    setLocalTasks((prevTasks) => prevTasks.filter((t) => t.id !== task.id));

    deleteTaskMutation.mutate({ id: task.id } as Task);
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  if (isLoading) return <p>Loading tasks...</p>;
  if (error) return <p>Failed to fetch tasks</p>;

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
              tasks={localTasks.filter((task) => task.status === column.id)}
              deleteTaskStatusInDB={deleteTask}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}