import React from 'react';
import { ArrowLeft, Search, Lightbulb, Droplets, Phone, ShieldCheck, Landmark, ReceiptText, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface GovServicesProps {
  onBack: () => void;
}

const services = [
  {
    id: 'edc',
    name: 'Electricité du Cambodge (EDC)',
    color: 'bg-yellow-400',
    labelKh: 'PTT',
    bgImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2fTnSCfV2MuSNxWdoHYo7CzB8z6SNqANScg&s'
  },
  {
    id: 'sportal',
    name: 'Sportal News',
    color: 'bg-[#0070c0]',
    labelKh: 'Sportal',
    bgImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Sportal.rs.png/500px-Sportal.rs.png'
  },
  {
    id: 'game',
    name: 'Game Reviews',
    color: 'bg-[#bf1e2e]',
    labelKh: 'Game',
    bgImage: 'https://gamefaqs.gamespot.com/a/box/0/6/5/890065_side.jpg'
  },
  {
    id: 'cinema',
    name: 'Cinema Ticket',
    color: 'bg-[#00609c]',
    labelKh: 'Cinema',
    bgImage: 'https://static.vecteezy.com/system/resources/previews/031/717/715/non_2x/cinema-ticket-with-barcode-icon-movie-ticket-template-realistic-cinema-theater-admission-pass-mock-up-coupon-vintage-retro-old-ticket-illustration-vector.jpg'
  },
  {
    id: 'todaytix',
    name: 'TodayTix App',
    color: 'bg-[#1e488f]',
    labelKh: 'TodayTix',
    bgImage: 'https://cdn-1.webcatalog.io/catalog/todaytix/todaytix-icon-filled-256.png?v=1775435963242'
  }
];

export default function GovServices({ onBack }: GovServicesProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
                  className="absolute inset-0 bg-white z-50 flex flex-col font-sans"
    >
      {/* Header */}
      <div className="relative h-64 overflow-hidden shrink-0">
        {/* Background Image Placeholder / Design */}
        <div className="absolute inset-0 bg-[#005c7a]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <motion.div 
            initial={{ scale: 1.1, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
             {/* Abstract pattern to simulate the professional ABA look */}
             <div className="w-full h-full opacity-30 flex items-center justify-center">
                <div className="w-[500px] h-[500px] border-[0.5px] border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-[400px] h-[400px] border-[0.5px] border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-[300px] h-[300px] border-[0.5px] border-white/20 rounded-full"></div>
                  </div>
                </div>
             </div>
          </motion.div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-10 pt-10">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white font-sans">Public Services</h1>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search public services..."
              className="w-full bg-white/90 backdrop-blur-xl h-12 rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00bcd4] shadow-lg shadow-black/10 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-t-3xl -mt-6 relative z-10 p-6">
        <div className="flex flex-col gap-6">
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[17px] font-bold text-gray-800 font-sans">Popular Partners</h2>
              <span className="text-xs font-bold text-[#00bcd4] uppercase tracking-wider">View All</span>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
                {services.slice(0, 3).map((s: any) => (
                  <motion.button 
                   key={s.id}
                   whileTap={{ scale: 0.98 }}
                   className="flex items-center gap-4 p-2 rounded-xl active:bg-gray-50 transition-colors text-left w-full group"
                 >
                   <div className={`w-14 h-14 rounded-2xl ${s.color} overflow-hidden flex items-center justify-center shrink-0 shadow-sm group-active:scale-95 transition-transform box-content`}>
                     <img src={s.bgImage} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   </div>
                   <div className="flex flex-col overflow-hidden">
                     <span className="text-sm font-bold text-gray-900 font-sans leading-tight">{s.labelKh}</span>
                     <span className="text-[11px] text-gray-500 font-medium truncate">{s.name}</span>
                   </div>
                   <ChevronRightIcon className="ml-auto w-5 h-5 text-gray-300" />
                 </motion.button>
                ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[17px] font-bold text-gray-800 font-sans">Service Categories</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {services.slice(3).map((s: any) => (
                <motion.button 
                  key={s.id}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:bg-gray-50 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-full ${s.color} overflow-hidden flex items-center justify-center shrink-0 shadow-sm group-active:scale-95 transition-transform`}>
                    <img src={s.bgImage} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-gray-800 font-sans leading-none mb-1">{s.labelKh}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{s.id}</span>
                  </div>
                </motion.button>
              ))}
              <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/50 p-5 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center gap-3 text-center active:bg-gray-50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-gray-400 font-bold text-lg">+</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-gray-400 font-sans leading-none mb-1">More</span>
                    <span className="text-[10px] text-gray-300 font-medium uppercase tracking-tight">More</span>
                  </div>
                </motion.button>
            </div>
          </section>
        </div>
        
        <div className="h-20" /> {/* Bottom spacing */}
      </div>
    </motion.div>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
