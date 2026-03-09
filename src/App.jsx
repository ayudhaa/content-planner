import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Notiflix from "notiflix";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [items, setItems] = useState({ idea: [], progress: [], done: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

  useEffect(() => {
    const saved = localStorage.getItem("planner_ultra_fix");
    if (saved) setItems(JSON.parse(saved));
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem("planner_ultra_fix", JSON.stringify(items));
    }
  }, [items, isDataLoaded]);

  const moveItem = (sourceCol, destCol, itemId) => {
    const sourceData = Array.from(items[sourceCol]);
    const destData = Array.from(items[destCol]);
    const itemIndex = sourceData.findIndex(i => i.id === itemId);
    const [removed] = sourceData.splice(itemIndex, 1);
    
    setItems({
      ...items,
      [sourceCol]: sourceData,
      [destCol]: [...destData, removed]
    });
    Notiflix.Notify.success(`Pindah ke ${destCol === 'progress' ? 'Sedang Dibuat' : 'Siap Posting'}`);
  };

  async function generateAICaption() {
    if (!GROQ_API_KEY || GROQ_API_KEY.includes("MASUKKAN")) {
      Notiflix.Notify.warning("Masukkan API Key Groq dulu!");
      return;
    }
    setIsLoading(true);
    Notiflix.Loading.pulse('AI lagi menulis captionnya nih...');
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Buatkan 1 caption ${platform} Bahasa Indonesia yang kreatif dan singkat. Langsung teksnya saja tanpa penjelasan.` }]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message) {
        setContent(data.choices[0].message.content.trim());
        Notiflix.Report.success("Ihiy caption udah digenerate nih", "", "Okay");
      }
    } catch (error) {
      Notiflix.Report.failure("Gagal memanggil AI.", "", "Okay");
    } finally {
      setIsLoading(false);
      Notiflix.Loading.remove();
    }
  }

  function addContent() {
    if (!content.trim()) {
      Notiflix.Report.info("Masukkan teks terlebih dahulu yaa", "", "Okay");
      return;
    }

    const hasAlphanumeric = /[a-zA-Z0-9]/.test(content);
    if (!hasAlphanumeric) {
      Notiflix.Report.warning("Input tidak valid", "Teks harus mengandung setidaknya huruf atau angka.", "Siap!");
      return;
    }

    const newItem = { id: "id-" + Date.now(), text: content, platform };
    setItems(prev => ({ ...prev, idea: [...prev.idea, newItem] }));
    setContent("");
    Notiflix.Report.success("Disimpan!", "", "Okay");
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    Notiflix.Notify.success("Teks disalin ke clipboard!");
  }

  function deleteOne(columnId, itemId) {
    setItems(prev => ({ ...prev, [columnId]: prev[columnId].filter(i => i.id !== itemId) }));
    Notiflix.Report.info("Item dihapus", "", "Okay");
  }

  function deleteAll() {
    Notiflix.Confirm.show(
      'Hapus Semua?',
      'Semua data akan dikosongkan permanen nih, yakin ?',
      'Iya, Hapus Semua',
      'Batal',
      () => {
        setItems({ idea: [], progress: [], done: [] });
        Notiflix.Report.success("Board dikosongkan", "", "Okay");
      }
    );
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    const { source, destination } = result;
    const start = Array.from(items[source.droppableId]);
    const finish = Array.from(items[destination.droppableId]);
    if (source.droppableId === destination.droppableId) {
      const [removed] = start.splice(source.index, 1);
      start.splice(destination.index, 0, removed);
      setItems({ ...items, [source.droppableId]: start });
    } else {
      const [removed] = start.splice(source.index, 1);
      finish.splice(destination.index, 0, removed);
      setItems({ ...items, [source.droppableId]: start, [destination.droppableId]: finish });
    }
  }

  const dynamicTextColor = { color: darkMode ? "#FFFFFF" : "#111827" };  
  const cardStyle = {
    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
    color: darkMode ? "#FFFFFF" : "#111827",
  };

  const inputStyle = {
    color: darkMode ? "#FFFFFF" : "#111827",
    backgroundColor: darkMode ? "#111827" : "#F9FAFB",
  };

  const dropdownStyle = { 
    color: darkMode ? "#FFFFFF" : "#111827",
    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF"
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? "bg-black" : "bg-gray-50"} flex flex-col`}>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8 flex-grow">
        <header className="flex justify-between items-center mb-6 md:mb-10 border-b dark:border-gray-800 pb-5">
          <div className="shrink-0">
            <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter" style={dynamicTextColor}>AI.PLANNER</h1>
            <p className="text-[8px] md:text-[10px] font-bold text-blue-500 tracking-[0.2em] md:tracking-[0.3em] uppercase">Professional Edition</p>
          </div>
          <div className="flex gap-2 md:gap-4 items-center">
            <button 
              onClick={deleteAll}
              className="text-[10px] md:text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase border border-red-500/30 px-2 md:px-3 py-1 rounded-lg"
            >
              Hapus Semua
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 md:p-3 bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl border dark:border-gray-700 text-xl md:text-2xl"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <div className="bg-white dark:bg-gray-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl mb-8 md:mb-12 border dark:border-gray-800">
          <textarea 
            style={inputStyle}
            className="w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-gray-100 dark:border-gray-700 outline-none focus:border-blue-500 text-base md:text-lg transition-colors"
            placeholder="Tulis ide konten..."
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
            <select 
              style={dropdownStyle}
              value={platform} 
              onChange={(e) => setPlatform(e.target.value)} 
              className="w-full sm:w-auto p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 font-black outline-none appearance-none"
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
            </select>
            <button onClick={generateAICaption} className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-xl font-black shadow-lg text-sm md:text-base transition-transform active:scale-95">🤖 AI GENERATE</button>
            <button onClick={addContent} className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-8 py-3 md:py-4 rounded-xl font-black shadow-lg text-sm md:text-base transition-transform active:scale-95">➕ SIMPAN</button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
            {['idea', 'progress', 'done'].map((col) => (
              <Droppable key={col} droppableId={col}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className="flex flex-col bg-gray-200/30 dark:bg-gray-900/40 p-4 md:p-6 rounded-[2rem] min-h-[300px] lg:min-h-[550px] border-2 border-dashed border-gray-300 dark:border-gray-800"
                  >
                    <h2 className="font-black text-center mb-6 md:mb-8 uppercase tracking-widest text-[10px] md:text-xs" style={dynamicTextColor}>
                      {col === 'idea' ? '📝 Ide Konten' : col === 'progress' ? '⚙️ Sedang Dibuat' : '✅ Siap Posting'}
                    </h2>
                    
                    {items[col].map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            {...provided.dragHandleProps} 
                            style={{ ...provided.draggableProps.style, ...cardStyle }}
                            className="p-4 md:p-6 rounded-2xl mb-4 shadow-xl border-l-4 md:border-l-8 border-blue-500 relative group transition-all"
                          >
                            <button 
                              onClick={() => deleteOne(col, item.id)} 
                              className="absolute top-2 right-3 text-gray-400 hover:text-red-500 font-bold text-xl md:text-2xl"
                            >
                              ×
                            </button>
                            
                            <p className="text-xs md:text-sm font-bold leading-relaxed mb-4 pr-6">
                              {item.text}
                            </p>
                            
                            <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] md:text-[10px] font-black bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 md:px-3 py-1 rounded-full uppercase">
                                  {item.platform}
                                </span>
                                
                                <button 
                                  onClick={() => copyToClipboard(item.text)}
                                  className="text-[9px] md:text-[10px] font-bold text-gray-400 hover:text-blue-500 dark:hover:text-white transition-colors flex items-center gap-1"
                                >
                                  📋 Copy
                                </button>
                              </div>

                              <div className="flex lg:hidden gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                {col === 'idea' && (
                                  <button 
                                    onClick={() => moveItem('idea', 'progress', item.id)}
                                    className="flex-1 py-2 bg-blue-500/10 text-blue-600 rounded-lg text-[9px] font-bold uppercase"
                                  >
                                    Mulai Kerjakan →
                                  </button>
                                )}
                                {col === 'progress' && (
                                  <button 
                                    onClick={() => moveItem('progress', 'done', item.id)}
                                    className="flex-1 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-bold uppercase"
                                  >
                                    Siap Posting →
                                  </button>
                                )}
                                {col === 'done' && (
                                  <button 
                                    onClick={() => moveItem('done', 'progress', item.id)}
                                    className="flex-1 py-2 bg-gray-500/10 text-gray-500 rounded-lg text-[9px] font-bold uppercase"
                                  >
                                    ← Revisi Lagi
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <footer className="py-6 md:py-8 text-center border-t dark:border-gray-800 mt-auto">
        <p className={`text-[10px] md:text-xs font-bold tracking-[0.2em] ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>
          made by<span className="text-red-500 animate-pulse">❤️</span>
        </p>
      </footer>
    </div>
  );
}