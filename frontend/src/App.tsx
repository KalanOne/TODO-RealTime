import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Plus, Check, Trash2, CheckSquare, Square, Loader2 } from 'lucide-react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const socket = io('http://localhost:3000/notifications');

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await fetch('http://localhost:3000/todos');
      const data = await res.json();
      setTodos(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();

    socket.on('todo_updated', () => {
      fetchTodos();
    });

    return () => {
      socket.off('todo_updated');
    };
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await fetch('http://localhost:3000/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setNewTitle('');
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    try {
      await fetch(`http://localhost:3000/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/todos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const completedTodos = todos.filter(todo => todo.completed);
  const activeTodos = todos.filter(todo => !todo.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg font-medium">Loading your todos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo List</h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Add Todo Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={addTodo} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={isAdding}
              />
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim() || isAdding}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-medium"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isAdding ? 'Adding...' : 'Add'}</span>
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{todos.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{activeTodos.length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{completedTodos.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-4">
          {/* Active Todos */}
          {activeTodos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Square className="w-4 h-4 mr-2 text-orange-600" />
                  Active Tasks ({activeTodos.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {activeTodos.map((todo, index) => (
                  <div
                    key={todo.id}
                    className="p-4 hover:bg-gray-50 transition-all duration-200 animate-in slide-in-from-right"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleComplete(todo)}
                          className="w-5 h-5 rounded border-2 border-gray-300 hover:border-indigo-500 transition-colors duration-200 flex items-center justify-center group"
                        >
                          <Check className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                        <span className="text-gray-800 font-medium">{todo.title}</span>
                      </div>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-green-600" />
                  Completed Tasks ({completedTodos.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {completedTodos.map((todo, index) => (
                  <div
                    key={todo.id}
                    className="p-4 hover:bg-gray-50 transition-all duration-200 animate-in slide-in-from-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleComplete(todo)}
                          className="w-5 h-5 rounded bg-green-500 border-2 border-green-500 hover:bg-green-600 hover:border-green-600 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </button>
                        <span className="text-gray-500 line-through">{todo.title}</span>
                      </div>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {todos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No tasks yet</h3>
              <p className="text-gray-600">Create your first task to get started!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Real-time updates • Changes sync automatically</p>
        </div>
      </div>
    </div>
  );
}