"use client"
import React, { useState, useEffect, useRef } from 'react'
import StopwatchTimer from '@/components/StopwatchTimer'

const Page = () => {
  const [title, settitle] = useState("")
  const [desc, setdesc] = useState("")
  const [mainTask, setMainTask] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeQuote, setActiveQuote] = useState("Fetching inspiration...");
  const [bgImage, setBgImage] = useState(""); // A default dark Audi

  // Load tasks and fetch quote
  useEffect(() => {
    const savedTasks = localStorage.getItem('myTasks')
    if (savedTasks) {
      setMainTask(JSON.parse(savedTasks))
    }
    setIsLoaded(true)

    const fetchQuote = async () => {
      try {
        const response = await fetch(`https://dummyjson.com/quotes/random?t=${Date.now()}`);
        const data = await response.json();
        setActiveQuote(data.quote); 
      } catch (error) {
        setActiveQuote("Be so good no one can ignore you.");
      }
    };

    fetchQuote();

    

    const fetchImage = async () => {
      try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=car,culture,scenery&orientation=landscape&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`);
        const data = await response.json();
        
        //update if 'urls' actually exists in the response
        if (data.urls && data.urls.full) {
          setBgImage(data.urls.full); 
        } else {
          // If it fails, this prints the exact reason Unsplash rejected it in your console
          console.error("Unsplash API rejected the request. Response:", data);
        }
      } catch (error) {
        console.error("Image API Error: ", error);
      }
    };

    fetchImage();
  }, []) 

  // Save tasks to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('myTasks', JSON.stringify(mainTask))
    }
  }, [mainTask, isLoaded])

  const submitHandler = (e) => {
    e.preventDefault()
    if(!title.trim()) return;

    setMainTask([...mainTask, { id: Date.now(), title, desc, completed: false }])
    settitle("")
    setdesc("")
  }

  const toggleCompleteHandler = (i) => {
    let copytask = [...mainTask]
    copytask[i].completed = !copytask[i].completed
    setMainTask(copytask)
  }

  // New delete handler
  const deleteHandler = (i) => {
    let copytask = [...mainTask]
    copytask.splice(i, 1)
    setMainTask(copytask)
  }

  // Drag and drop tracking
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleSort = () => {
    let copyTasks = [...mainTask]
    const draggedItemContent = copyTasks.splice(dragItem.current, 1)[0]
    copyTasks.splice(dragOverItem.current, 0, draggedItemContent)
    
    dragItem.current = null
    dragOverItem.current = null
    
    setMainTask(copyTasks)
  }

  let renderTask = <h2 className="text-gray-300 text-lg font-medium">No Task Available</h2>

  if(mainTask.length > 0){
    renderTask = mainTask.map((t, i) => {
      return (
        <li 
          key={t.id || i} 
          draggable
          onDragStart={(e) => {
            dragItem.current = i;
            e.dataTransfer.setData('text/plain', i); 
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnter={() => (dragOverItem.current = i)}
          onDragEnd={handleSort}
          onDragOver={(e) => e.preventDefault()}
          className={`flex items-center justify-between px-4 py-4 rounded-xl mb-3 transition-all backdrop-blur-md border cursor-grab active:cursor-grabbing ${
            t.completed ? 'bg-black/20 border-white/5' : 'bg-black/60 border-white/10 shadow-lg'
          }`}
        >
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => toggleCompleteHandler(i)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink:0 flex items-center justify-center transition-colors ${
                t.completed 
                  ? 'bg-gray-500 border-gray-500' 
                  : 'border-gray-400 hover:bg-white/20 hover:border-white'
              }`}
            >
              {t.completed && <span className="text-white text-[10px] font-bold">✓</span>}
            </button>
            
            <div className='flex flex-col'>
              <h5 className={`text-lg font-medium transition-colors ${
                t.completed ? 'text-gray-500 line-through' : 'text-gray-100'
              }`}>
                {t.title}
              </h5>
              {t.desc && (
                <h6 className={`text-sm transition-colors ${
                  t.completed ? 'text-gray-600 line-through' : 'text-gray-400'
                }`}>
                  {t.desc}
                </h6>
              )}
            </div>
          </div>
          
          <button 
            //e.stopPropagation() here so clicking delete doesn't trigger a drag event
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={() => deleteHandler(i)}
            className="text-gray-500 hover:text-red-400 transition-colors px-2 py-1 text-lg ml-4"
            title="Delete task"
          >
            ✕
          </button>
        </li>
      );
    });
  }

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden font-sans bg-cover bg-center text-white transition-all duration-700" 
      style={{ 
        backgroundImage: `url('${bgImage}')`,
        backgroundColor: "#1a1a1a" 
      }} 
    >
      <aside className="w-64 bg-black/40 backdrop-blur-xl flex flex-col p-6 border-r border-white/10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center font-bold text-lg text-white">
            A
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight text-white">Amritesh</h3>
          </div>
        </div>

        <nav className="space-y-1 text-sm text-gray-200">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 font-medium text-white">
            <span>Tasks To Do</span>
            <span className="ml-auto bg-blue-600 text-xs px-2 py-0.5 rounded-full">{mainTask.length}</span>
          </a>
          <div className="mt-auto p-1">
            <StopwatchTimer />
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative bg-black/20 p-10">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
            Welcome Back, Amritesh<span className="text-blue-500">.</span>
          </h1>
          <p className="text-gray-300 font-medium text-lg">
            {activeQuote}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <ul className="max-w-3xl">
            {renderTask}
          </ul>
        </div>

        <div className="absolute bottom-10 left-10">
          <form 
            onSubmit={submitHandler} 
            className="w-700px bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4 shadow-2xl"
          >
            <span className="text-gray-400 text-xl font-light">+</span>
            
            <input 
              type="text" 
              className="bg-transparent outline-none w-1/3 text-gray-100 placeholder-gray-400 border-r border-white/20 pr-4" 
              placeholder="Task title"
              value={title}
              onChange={(e) => settitle(e.target.value)}
            />
            
            <input 
              type="text" 
              className="bg-transparent outline-none w-2/3 text-gray-100 placeholder-gray-400 pl-4" 
              placeholder="Task description"
              value={desc}
              onChange={(e) => setdesc(e.target.value)}
            />
            
            <button type="submit" className="hidden">Add</button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Page







 