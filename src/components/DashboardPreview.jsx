import { useState, useEffect } from 'react';
import { Calendar, Users, Camera, AlertTriangle, TrendingUp, Bell, Search, RefreshCw } from 'lucide-react';
import useScrollReveal from '../hooks/useScrollReveal';
import './DashboardPreview.css';

export default function DashboardPreview() {
  const [sectionRef, isVisible] = useScrollReveal();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  
  // Real-time dynamic logs simulation
  const [logs, setLogs] = useState([
    { id: 1, student: "Sophia Martinez", course: "ENG-101 (Lit)", match: "99.8%", status: "Present", time: "13:21:05", color: "green" },
    { id: 2, student: "Daniel Lee", course: "CHEM-203 (Lab)", match: "99.1%", status: "Late (10m)", time: "13:19:40", color: "orange" },
    { id: 3, student: "Marcus Chen", course: "CS-102 (OOP)", match: "99.4%", status: "Present", time: "13:18:12", color: "green" },
    { id: 4, student: "Emily Watson", course: "MATH-301 (Calc)", match: "98.7%", status: "Present", time: "13:15:58", color: "green" },
    { id: 5, student: "Alex Rodriguez", course: "PHYS-101 (Mech)", match: "99.0%", status: "Present", time: "13:14:02", color: "green" }
  ]);

  useEffect(() => {
    // Clock in dashboard
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Dynamic feed updates (simulated student entry checks)
    const logPool = [
      { student: "Sarah Jenkins", course: "BIO-201 (Genetics)", match: "99.6%", status: "Present", color: "green" },
      { student: "David Kim", course: "CS-102 (OOP)", match: "98.9%", status: "Present", color: "green" },
      { student: "Liam O'Connor", course: "ENG-101 (Lit)", match: "99.2%", status: "Late (5m)", color: "orange" },
      { student: "Jessica Taylor", course: "PHYS-101 (Mech)", match: "99.7%", status: "Present", color: "green" },
      { student: "Ryan Patel", course: "CHEM-203 (Lab)", match: "98.5%", status: "Present", color: "green" }
    ];

    const feedInterval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs(prev => [
        {
          id: Date.now(),
          student: randomLog.student,
          course: randomLog.course,
          match: randomLog.match,
          status: randomLog.status,
          time: timeStr,
          color: randomLog.color
        },
        ...prev.slice(0, 4) // Keep 5 logs
      ]);
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(feedInterval);
    };
  }, []);

  // Attendance Trend Data (SVG Coordinates)
  const chartData = [
    { day: "Mon", rate: 92, x: 20, y: 110, tooltip: "Mon: 92% present" },
    { day: "Tue", rate: 95, x: 60, y: 80, tooltip: "Tue: 95% present" },
    { day: "Wed", rate: 93, x: 100, y: 100, tooltip: "Wed: 93% present" },
    { day: "Thu", rate: 97, x: 140, y: 60, tooltip: "Thu: 97% present" },
    { day: "Fri", rate: 96, x: 180, y: 70, tooltip: "Fri: 96% present" }
  ];

  return (
    <section className="section-padding dashboard-preview-section" id="dashboard">
      <div className="bg-glow-orb preview-glow" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'rgba(59, 130, 246, 0.12)' }}></div>
      
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Administrative Dashboard Preview</h2>
          <p className="section-subtitle">
            Get 360-degree oversight of campus activities, analytics indices, and presence tallies.
          </p>
        </div>

        <div 
          ref={sectionRef} 
          className={`glass-panel main-dashboard-mockup scroll-reveal ${isVisible ? 'visible' : ''}`}
        >
          {/* Dashboard Header Bar */}
          <div className="dash-mock-header">
            <div className="dash-mock-title">
              <span className="live-status-pulse"></span>
              <h3>AttendAI Portal</h3>
              <span className="dash-badge">CAMPUS_ADMIN</span>
            </div>
            
            <div className="dash-mock-search">
              <Search size={14} className="search-icon" />
              <input type="text" placeholder="Search students, departments, logs..." disabled />
            </div>

            <div className="dash-mock-meta">
              <span className="dash-clock">{currentTime || '13:21:05'}</span>
              <Bell size={16} className="dash-header-icon" />
              <RefreshCw size={16} className="dash-header-icon rotate-anim" />
              <div className="dash-avatar">AD</div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="dash-metrics-grid">
            <div className="metric-mini-card">
              <Users size={18} className="m-icon blue" />
              <div>
                <p className="m-label">Avg Attendance</p>
                <p className="m-val">94.62%</p>
              </div>
              <span className="trend-pos">+1.4%</span>
            </div>
            
            <div className="metric-mini-card">
              <TrendingUp size={18} className="m-icon purple" />
              <div>
                <p className="m-label">Class Engagement</p>
                <p className="m-val">86.20%</p>
              </div>
              <span className="trend-pos">+3.8%</span>
            </div>

            <div className="metric-mini-card">
              <Camera size={18} className="m-icon green" />
              <div>
                <p className="m-label">Active Feeds</p>
                <p className="m-val">18 / 18</p>
              </div>
              <span className="status-online">ONLINE</span>
            </div>

            <div className="metric-mini-card">
              <AlertTriangle size={18} className="m-icon orange" />
              <div>
                <p className="m-label">Absence Alerts</p>
                <p className="m-val">12 Flagged</p>
              </div>
              <span className="trend-neg">Review</span>
            </div>
          </div>

          {/* Charts & Log Grid */}
          <div className="dash-charts-grid">
            {/* 1. Attendance Line Chart */}
            <div className="chart-panel">
              <h4 className="chart-panel-title">Weekly Attendance Rate</h4>
              <div className="chart-wrapper">
                <svg viewBox="0 0 200 150" className="dashboard-svg-chart">
                  {/* Grid Lines */}
                  <line x1="20" y1="30" x2="180" y2="30" stroke="rgba(255,255,255,0.05)" />
                  <line x1="20" y1="70" x2="180" y2="70" stroke="rgba(255,255,255,0.05)" />
                  <line x1="20" y1="110" x2="180" y2="110" stroke="rgba(255,255,255,0.05)" />
                  
                  {/* Chart Paths */}
                  <path 
                    d="M20,110 L60,80 L100,100 L140,60 L180,70" 
                    fill="none" 
                    stroke="url(#chartGlowGrad)" 
                    strokeWidth="3" 
                  />
                  
                  {/* Chart Area Fill */}
                  <path 
                    d="M20,110 L60,80 L100,100 L140,60 L180,70 L180,140 L20,140 Z" 
                    fill="url(#chartAreaGrad)" 
                    opacity="0.3"
                  />

                  {/* Interactive Nodes */}
                  {chartData.map((pt, i) => (
                    <g key={i}>
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="5" 
                        fill="#3b82f6" 
                        stroke="rgba(255,255,255,0.7)"
                        strokeWidth="1.5"
                        className="chart-dot"
                        onMouseEnter={() => setActiveTooltip(pt.tooltip)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    </g>
                  ))}
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="chartGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
                      <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Day Labels */}
                <div className="chart-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                </div>

                {/* Custom Tooltip */}
                {activeTooltip && (
                  <div className="chart-tooltip">
                    {activeTooltip}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Department Statistics (Bar Chart) */}
            <div className="chart-panel">
              <h4 className="chart-panel-title">Department Presence Ratio</h4>
              <div className="bars-chart-wrapper">
                <div className="mini-bar-item">
                  <span className="bar-tag">Computer Sci.</span>
                  <div className="bar-track"><div className="bar-fill blue" style={{ width: '96%' }}></div></div>
                  <span className="bar-percent">96%</span>
                </div>
                <div className="mini-bar-item">
                  <span className="bar-tag">Engineering</span>
                  <div className="bar-track"><div className="bar-fill purple" style={{ width: '92%' }}></div></div>
                  <span className="bar-percent">92%</span>
                </div>
                <div className="mini-bar-item">
                  <span className="bar-tag">Natural Sci.</span>
                  <div className="bar-track"><div className="bar-fill pink" style={{ width: '89%' }}></div></div>
                  <span className="bar-percent">89%</span>
                </div>
                <div className="mini-bar-item">
                  <span className="bar-tag">Liberal Arts</span>
                  <div className="bar-track"><div className="bar-fill green" style={{ width: '94%' }}></div></div>
                  <span className="bar-percent">94%</span>
                </div>
              </div>
            </div>

            {/* 3. Engagement Distribution (Doughnut Chart) */}
            <div className="chart-panel flex-column-center">
              <h4 className="chart-panel-title">Engagement Distribution</h4>
              <div className="doughnut-container">
                <svg width="120" height="120" viewBox="0 0 40 40" className="doughnut-chart">
                  <circle cx="20" cy="20" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  
                  {/* Attentive Segment (65%) */}
                  <circle cx="20" cy="20" r="15.915" fill="none" stroke="var(--color-blue)" strokeWidth="4.2" 
                    strokeDasharray="65 35" strokeDashoffset="25" />
                  
                  {/* Neutral Segment (23%) */}
                  <circle cx="20" cy="20" r="15.915" fill="none" stroke="var(--color-purple)" strokeWidth="4.2" 
                    strokeDasharray="23 77" strokeDashoffset="-40" />

                  {/* Disengaged Segment (12%) */}
                  <circle cx="20" cy="20" r="15.915" fill="none" stroke="var(--color-pink)" strokeWidth="4.2" 
                    strokeDasharray="12 88" strokeDashoffset="-63" />
                </svg>
                <div className="doughnut-inner-text">
                  <span className="inner-val">86.2%</span>
                  <span className="inner-lbl">Attentiveness</span>
                </div>
              </div>
              <div className="doughnut-legend">
                <span className="legend-dot blue">Attentive (65%)</span>
                <span className="legend-dot purple">Neutral (23%)</span>
                <span className="legend-dot pink">Passive (12%)</span>
              </div>
            </div>

            {/* 4. Live Verification Feed */}
            <div className="chart-panel">
              <div className="feed-header">
                <h4 className="chart-panel-title">Live Verification Logs</h4>
                <span className="feed-pulse-indicator">● SYNCED</span>
              </div>
              <div className="logs-feed-container">
                {logs.map((log) => (
                  <div key={log.id} className="feed-log-item animate-slide-in">
                    <span className="log-time">{log.time}</span>
                    <div className="log-content">
                      <span className="log-student">{log.student}</span>
                      <span className="log-course">{log.course}</span>
                    </div>
                    <div className="log-stats">
                      <span className="log-match">Match: {log.match}</span>
                      <span className={`log-badge ${log.color}`}>{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
