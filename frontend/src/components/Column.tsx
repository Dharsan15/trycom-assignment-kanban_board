import { useDroppable } from '@dnd-kit/core';
import React from 'react';
import { TaskCard } from './TaskCard';
import { Task } from '../utils/type';

type ColumnProps = {
  column: { id: string; title: string };
  deleteTaskStatusInDB :  (task: Task) => void;
  tasks: Task[];
  darkMode: boolean;
};

export const Column: React.FC<ColumnProps> = ({ column, deleteTaskStatusInDB  , tasks, darkMode }) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`w-80 p-4 rounded-md shadow-md transition-all ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      }`}
    >
      <h2 className="text-lg font-semibold mb-2">{column.title}</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard deleteTask={deleteTaskStatusInDB} key={task.id} task={task} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};