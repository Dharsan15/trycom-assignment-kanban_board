import { useDraggable } from '@dnd-kit/core';
import { Task } from '../utils/type';
import { FaTrash } from 'react-icons/fa';

interface TaskCardProps {
  task: Task;
  darkMode: boolean;
  deleteTask: (task : Task) => void;
}

export function TaskCard({ task, darkMode, deleteTask }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`p-4 rounded-lg shadow-md transition-all ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <div className='flex justify-between items-center'>
        <h3 className='font-bold'>{task.title}</h3>
        <button onClick={(e) =>{
          e.stopPropagation(); 
          deleteTask(task)}}  className='text-red-500 hover:text-red-700'>
          <FaTrash />
        </button>
      </div>
      <p className='mt-2 text-sm'>{task.description}</p>
    </div>
  );
}