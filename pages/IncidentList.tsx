import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, ChevronDown, Eye, Users, Calendar, ArrowUpDown, Printer } from 'lucide-react';
import * as Storage from '../services/storage';
import { EnrichedIncident, IncidentStatus, IncidentCategory, SchoolClass } from '../types';

export const IncidentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [incidents, setIncidents] = useState<EnrichedIncident[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States - Initialize from URL if present
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [rawIncidents, students, classes, years] = await Promise.all([
                Storage.getIncidents(),
                Storage.getStudents(),
                Storage.getClasses(),
                Storage.getYears()
            ]);

            setAvailableClasses(classes);

            const enriched = rawIncidents.map(inc => {
                const student = students.find(s => s.id === inc.studentId);
                const cls = student ? classes.find(c => c.id === student.classId) : null;
                const year = cls ? years.find(y => y.id === cls.yearLevelId) : null;

                return {
                    ...inc,
                    studentName: student ? `${student.lastName}, ${student.firstName}` : 'Unbekannt',
                    className: cls ? cls.name : '?',
                    classId: cls ? cls.id : undefined,
                    yearLevelName: year ? year.name : '?',
                };
            });

            setIncidents(enriched);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, []);

  // Derive available months from data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    incidents.forEach(inc => {
        const date = new Date(inc.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [incidents]);

  const formatMonthLabel = (yyyyMm: string) => {
      const [year, month] = yyyyMm.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  const filteredIncidents = useMemo(() => {
    let result = incidents.filter(inc => {
      const matchesSearch = 
        inc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || inc.category === categoryFilter;
      const matchesClass = classFilter === 'ALL' || inc.classId === classFilter;
      const matchesMonth = monthFilter === 'ALL' || inc.date.startsWith(monthFilter);

      return matchesSearch && matchesStatus && matchesCategory && matchesClass && matchesMonth;
    });

    // Sort
    result.sort((a, b) => {
        const getTimestamp = (inc: EnrichedIncident) => {
            if (!inc.date) return 0;
            const [hours, minutes] = (inc.time || "00:00").split(':');
            const paddedTime = `${(hours || '00').padStart(2, '0')}:${(minutes || '00')}`;
            const dateStr = `${inc.date}T${paddedTime}`;
            return new Date(dateStr).getTime();
        };

        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        
        return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [incidents, searchTerm, statusFilter, categoryFilter, classFilter, monthFilter, sortOrder]);

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
        case IncidentStatus.OPEN: return 'bg-red-100 text-red-800';
        case IncidentStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
        case IncidentStatus.RESOLVED: return 'bg-green-100 text-green-800';
        case IncidentStatus.MONITORING: return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedClasses = [...availableClasses].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  const handlePrintPreview = () => {
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (classFilter !== 'ALL') params.append('class', classFilter);
      if (monthFilter !== 'ALL') params.append('month', monthFilter);

      // Open new tab
      const url = `#/print?${params.toString()}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">Vorfallsprotokolle</h2>
           <p className="text-gray-500">Verwalten und filtern Sie alle dokumentierten Konflikte.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handlePrintPreview}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm"
            >
                <Printer className="w-5 h-5 mr-2" /> Druckvorschau
            </button>
            <NavLink to="/incidents/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> Neuer Eintrag
            </NavLink>
        </div>
      </div>

      {/* Filters Container */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4 filters-container">
        
        {/* Row 1: Search */}
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Suche nach Schüler oder Stichwort..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        {/* Row 2: Dropdowns */}
        <div className="flex flex-wrap gap-4">
             {/* Class Filter */}
             <div className="relative flex-1 min-w-[150px]">
                <select 
                    value={classFilter} 
                    onChange={e => setClassFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                    <option value="ALL">Alle Klassen</option>
                    {sortedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
             </div>

             {/* Status Filter */}
             <div className="relative flex-1 min-w-[150px]">
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                    <option value="ALL">Alle Status</option>
                    {Object.values(IncidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
             </div>

             {/* Category Filter */}
             <div className="relative flex-1 min-w-[150px]">
                <select 
                    value={categoryFilter} 
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                    <option value="ALL">Alle Kategorien</option>
                    {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
             </div>

             {/* Month Filter */}
             <div className="relative flex-1 min-w-[150px]">
                <select 
                    value={monthFilter} 
                    onChange={e => setMonthFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                    <option value="ALL">Alle Zeiträume</option>
                    {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
             </div>

             {/* Sort Order */}
             <div className="relative min-w-[140px]">
                 <button 
                    onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
                 >
                    <span>{sortOrder === 'DESC' ? 'Neueste zuerst' : 'Älteste zuerst'}</span>
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                 </button>
             </div>
        </div>
      </div>

      {/* Screen List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Datum / Ort</th>
                        <th className="px-6 py-4 font-semibold">Schüler:in</th>
                        <th className="px-6 py-4 font-semibold">Kategorie</th>
                        <th className="px-6 py-4 font-semibold">Kurzbeschreibung</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Aktion</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                         <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Lade Daten...</td></tr>
                    ) : filteredIncidents.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                Keine Einträge gefunden.
                            </td>
                        </tr>
                    ) : (
                        filteredIncidents.map(inc => (
                            <tr 
                                key={inc.id} 
                                onClick={() => navigate(`/incidents/edit/${inc.id}`)}
                                className="hover:bg-blue-50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{new Date(inc.date).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">{inc.time} Uhr</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{inc.studentName}</div>
                                    <div className="text-xs text-gray-500">{inc.className} ({inc.yearLevelName})</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {inc.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate text-gray-600">
                                    {inc.description}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inc.status)}`}>
                                        {inc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-white rounded-full transition shadow-sm border border-transparent hover:border-blue-100">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};