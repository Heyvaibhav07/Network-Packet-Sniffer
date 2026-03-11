import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Filter, 
  Search, 
  Terminal, 
  BarChart3, 
  List, 
  Cpu, 
  Globe, 
  Lock,
  ChevronRight,
  ChevronDown,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Packet, Threat } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // WebSocket Connection
  useEffect(() => {
    if (isPaused) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'PACKET') {
        setPackets(prev => {
          const newPackets = [message.data, ...prev];
          return newPackets.slice(0, 100); // Keep last 100 packets
        });
      }
    };

    return () => ws.close();
  }, [isPaused]);

  const filteredPackets = useMemo(() => {
    return packets.filter(p => {
      const matchesSearch = 
        p.srcIp.includes(filter) || 
        p.dstIp.includes(filter) || 
        p.info.toLowerCase().includes(filter.toLowerCase());
      const matchesProtocol = protocolFilter ? p.protocol === protocolFilter : true;
      return matchesSearch && matchesProtocol;
    });
  }, [packets, filter, protocolFilter]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    packets.forEach(p => {
      counts[p.protocol] = (counts[p.protocol] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [packets]);

  const timeData = useMemo(() => {
    // Group packets by second for the line chart
    const groups: Record<string, number> = {};
    packets.forEach(p => {
      const sec = new Date(p.timestamp).toLocaleTimeString([], { second: '2-digit' });
      groups[sec] = (groups[sec] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([time, packets]) => ({ time, packets }))
      .slice(-20)
      .reverse();
  }, [packets]);

  const threats = useMemo(() => {
    return packets.filter(p => p.threat !== null);
  }, [packets]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E3E0] font-mono selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-14 border-b border-[#1A1A1C] flex items-center justify-between px-6 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded flex items-center justify-center border border-emerald-500/20">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase">NetPulse <span className="text-emerald-500/50 text-xs font-normal ml-2">v1.0.4</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1C] rounded-md border border-[#2A2A2C]">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isPaused ? "bg-yellow-500" : "bg-emerald-500")} />
            <span className="text-xs uppercase tracking-wider">{isPaused ? 'Monitoring Paused' : 'Live Monitoring'}</span>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 hover:bg-[#1A1A1C] rounded-md transition-colors border border-transparent hover:border-[#2A2A2C]"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setPackets([])}
            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors border border-transparent hover:border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left Sidebar - Stats & Filters */}
        <aside className="col-span-3 border-r border-[#1A1A1C] p-4 flex flex-col gap-6 overflow-y-auto bg-[#0D0D0E]">
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/50 mb-4 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Traffic Overview
            </h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1C" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1C', border: '1px solid #2A2A2C', fontSize: '10px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Line type="monotone" dataKey="packets" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/50 mb-4 flex items-center gap-2">
              <PieChart className="w-3 h-3" /> Protocol Distribution
            </h2>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1C', border: '1px solid #2A2A2C', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stats.map((s, i) => (
                <button 
                  key={s.name}
                  onClick={() => setProtocolFilter(protocolFilter === s.name ? null : s.name)}
                  className={cn(
                    "text-[10px] flex items-center gap-2 px-2 py-1 rounded border transition-all",
                    protocolFilter === s.name 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                      : "bg-[#1A1A1C] border-[#2A2A2C] text-[#8E9299] hover:border-[#3A3A3C]"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {s.name}: {s.value}
                </button>
              ))}
            </div>
          </section>

          <section className="flex-1">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-red-500/50 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Security Threats ({threats.length})
            </h2>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {threats.slice(0, 5).map((t) => (
                  <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 bg-red-500/5 border border-red-500/20 rounded-md text-[10px]"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-500 uppercase">{t.threat?.type}</span>
                      <span className="text-[8px] opacity-50">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[#8E9299] leading-tight">{t.threat?.description}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {threats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 opacity-20">
                  <ShieldCheck className="w-8 h-8 mb-2" />
                  <span className="text-[10px] uppercase">No Threats Detected</span>
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Main Content - Packet List */}
        <div className="col-span-9 flex flex-col overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-[#1A1A1C] flex gap-4 bg-[#0A0A0B]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A4C]" />
              <input 
                type="text"
                placeholder="Search by IP, Protocol, or Info..."
                className="w-full bg-[#1A1A1C] border border-[#2A2A2C] rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4A4A4C]">
              <Filter className="w-4 h-4" />
              <span>Showing {filteredPackets.length} packets</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 bg-[#1A1A1C]/30 text-[10px] uppercase tracking-widest text-[#4A4A4C] border-b border-[#1A1A1C]">
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Proto</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2">Destination</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-5">Info</div>
          </div>

          {/* Packet List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollRef}>
            <AnimatePresence initial={false}>
              {filteredPackets.map((packet) => (
                <motion.div 
                  key={packet.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedPacket(packet)}
                  className={cn(
                    "grid grid-cols-12 px-4 py-2.5 border-b border-[#1A1A1C] text-[11px] cursor-pointer transition-colors group",
                    selectedPacket?.id === packet.id ? "bg-emerald-500/10" : "hover:bg-[#1A1A1C]/50",
                    packet.threat ? "border-l-2 border-l-red-500" : ""
                  )}
                >
                  <div className="col-span-1 opacity-50">{new Date(packet.timestamp).toLocaleTimeString([], { hour12: false })}</div>
                  <div className="col-span-1">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold",
                      packet.protocol === 'TCP' ? "bg-blue-500/20 text-blue-400" :
                      packet.protocol === 'UDP' ? "bg-purple-500/20 text-purple-400" :
                      packet.protocol === 'HTTP' ? "bg-emerald-500/20 text-emerald-400" :
                      packet.protocol === 'TLS' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {packet.protocol}
                    </span>
                  </div>
                  <div className="col-span-2 text-emerald-500/80">{packet.srcIp}</div>
                  <div className="col-span-2 text-blue-500/80">{packet.dstIp}</div>
                  <div className="col-span-1 opacity-50">{packet.size} B</div>
                  <div className="col-span-5 truncate text-[#8E9299] group-hover:text-[#E4E3E0] transition-colors">
                    {packet.info}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom Panel - Packet Details */}
          <div className={cn(
            "h-64 border-t border-[#1A1A1C] bg-[#0D0D0E] transition-all duration-300 flex flex-col",
            !selectedPacket && "h-10"
          )}>
            <div 
              className="px-4 py-2 bg-[#1A1A1C]/50 flex items-center justify-between cursor-pointer"
              onClick={() => !selectedPacket && setSelectedPacket(packets[0])}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-500/50">
                <Terminal className="w-3 h-3" /> Packet Inspector
              </div>
              {selectedPacket && (
                <button onClick={(e) => { e.stopPropagation(); setSelectedPacket(null); }} className="text-[#4A4A4C] hover:text-[#E4E3E0]">
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {selectedPacket ? (
              <div className="flex-1 p-4 grid grid-cols-2 gap-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] text-[#4A4A4C] uppercase mb-2">Frame Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-[#4A4A4C]">Packet ID:</span> <span className="text-emerald-500">{selectedPacket.id}</span>
                      <span className="text-[#4A4A4C]">Timestamp:</span> <span>{selectedPacket.timestamp}</span>
                      <span className="text-[#4A4A4C]">Total Length:</span> <span>{selectedPacket.size} bytes</span>
                      <span className="text-[#4A4A4C]">Protocol:</span> <span className="font-bold">{selectedPacket.protocol}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] text-[#4A4A4C] uppercase mb-2">Network Layer</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-[#4A4A4C]">Source IP:</span> <span className="text-emerald-500">{selectedPacket.srcIp}</span>
                      <span className="text-[#4A4A4C]">Source Port:</span> <span>{selectedPacket.srcPort}</span>
                      <span className="text-[#4A4A4C]">Destination IP:</span> <span className="text-blue-500">{selectedPacket.dstIp}</span>
                      <span className="text-[#4A4A4C]">Destination Port:</span> <span>{selectedPacket.dstPort}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] text-[#4A4A4C] uppercase mb-2">Payload Hex Dump</h3>
                    <div className="bg-[#050505] p-3 rounded border border-[#1A1A1C] font-mono text-[10px] leading-relaxed text-[#4A4A4C] h-32 overflow-y-auto">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-emerald-500/30">00{i}0</span>
                          <span className="text-[#8E9299]">
                            {Array.from({ length: 8 }).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ')}
                          </span>
                          <span className="text-emerald-500/20">........</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedPacket.threat && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                      <div className="flex items-center gap-2 text-red-500 mb-1">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Security Alert: {selectedPacket.threat.type}</span>
                      </div>
                      <p className="text-[11px] text-[#8E9299]">{selectedPacket.threat.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[10px] text-[#4A4A4C] uppercase tracking-widest">
                Select a packet to inspect payload
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-6 border-t border-[#1A1A1C] bg-[#0A0A0B] px-4 flex items-center justify-between text-[9px] uppercase tracking-widest text-[#4A4A4C]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> CPU: 12%
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Interface: eth0
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> SSL: Active
          </div>
          <div>Packets Captured: {packets.length}</div>
        </div>
      </footer>
    </div>
  );
}
