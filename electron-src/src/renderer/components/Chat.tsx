import React from 'react';

export default function Chat( {isOpen, onClose} ) {
    if (!isOpen) return null;

  return (
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-lg z-50 flex flex-col">
        <button 
            type="button"
            onClick={onClose} 
            className="absolute top-2 left-2 text-gray-500 hover:text-gray-700 p-2">
            x
        </button>
        <form className = "flex flex-col flex-1">
            <div className="flex justify-center items-center py-4">
                <h1 className="text-lg font-semibold">Chat</h1>
            </div>            
            <div className="flex-1 px-4 py-2 overflow-y-auto flex flex-col justify-center space-y-2">
                Message List ....
            </div>
            <div className="px-3 py-2 border-t flex gap-2">
                <input type="text" 
                className="flex-1 p-2 border border rounded-lg focus:border-blue-500 outline-none" 
                placeholder="Type your message here" />
                <button 
                type="button"
                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm cursor-pointer"
                >
                    Send
                </button>
            </div>
        </form>
      </div>
  );
}