import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, X } from 'lucide-react';
import * as Storage from '../services/storage';
import { EnrichedIncident, IncidentStatus, IncidentCategory, SchoolClass } from '../types';

export const PrintView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<EnrichedIncident[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Read filters from URL
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const classFilter = searchParams.get('class') || 'ALL';
  const monthFilter = searchParams.get('month') || 'ALL';

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
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

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

    // Sort by date descending (standard for reports)
    result.sort((a, b) => {
        const getTimestamp = (inc: EnrichedIncident) => {
            if (!inc.date) return 0;
            const [hours, minutes] = (inc.time || "00:00").split(':');
            const paddedTime = `${(hours || '00').padStart(2, '0')}:${(minutes || '00')}`;
            const dateStr = `${inc.date}T${paddedTime}`;
            return new Date(dateStr).getTime();
        };
        return getTimestamp(b) - getTimestamp(a);
    });

    return result;
  }, [incidents, searchTerm, statusFilter, categoryFilter, classFilter, monthFilter]);

  return (
    <div className="bg-white min-h-screen p-8 text-black">
      
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg z-50">
        <div>
            <h2 className="font-bold text-lg">Druckvorschau</h2>
            <p className="text-slate-300 text-xs">Überprüfen Sie die Daten und klicken Sie auf "Jetzt Drucken", um das Dokument zu erstellen.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => window.close()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center transition"
            >
                <X className="w-4 h-4 mr-2" /> Schließen
            </button>
            <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center font-bold transition"
            >
                <Printer className="w-4 h-4 mr-2" /> Jetzt Drucken
            </button>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-20 no-print"></div>

      {/* Report Header */}
      <div className="mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold mb-2">Konfliktprotokoll</h1>
            <div className="flex justify-between items-end">
                <div className="text-sm space-y-1">
                    <p><strong>Erstellt am:</strong> {new Date().toLocaleDateString()} um {new Date().toLocaleTimeString()}</p>
                    <p>
                        <strong>Filter:</strong> {' '}
                        {searchTerm && `Suche: "${searchTerm}" • `}
                        {classFilter !== 'ALL' && `Klasse: ${availableClasses.find(c => c.id === classFilter)?.name} • `}
                        {statusFilter !== 'ALL' && `Status: ${statusFilter} • `}
                        {categoryFilter !== 'ALL' && `Kategorie: ${categoryFilter}`}
                        {classFilter === 'ALL' && statusFilter === 'ALL' && categoryFilter === 'ALL' && !searchTerm && "Alle Einträge"}
                    </p>
                </div>
                <div className="text-right text-sm">
                    <strong>Anzahl:</strong> {filteredIncidents.length} Einträge
                </div>
            </div>
      </div>

      {/* Data Table */}
      <table className="print-table w-full text-left">
            <thead>
                <tr>
                    <th style={{ width: '15%' }}>Datum/Ort</th>
                    <th style={{ width: '15%' }}>Schüler:in</th>
                    <th style={{ width: '15%' }}>Kategorie</th>
                    <th style={{ width: '25%' }}>Beschreibung & Beteiligte</th>
                    <th style={{ width: '20%' }}>Maßnahmen & Verbleib</th>
                    <th style={{ width: '10%' }}>Status</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={6} className="text-center p-8 text-gray-500 italic">Lade Daten...</td></tr>
                ) : filteredIncidents.length === 0 ? (
                     <tr><td colSpan={6} className="text-center p-8 text-gray-500 italic">Keine Einträge für diese Auswahl gefunden.</td></tr>
                ) : (
                    filteredIncidents.map(inc => (
                        <tr key={inc.id}>
                            <td>
                                <div className="font-bold">{new Date(inc.date).toLocaleDateString()}</div>
                                <div>{inc.time} Uhr</div>
                                <div className="text-gray-600 italic mt-1 text-xs">{inc.location}</div>
                            </td>
                            <td>
                                <div className="font-bold">{inc.studentName}</div>
                                <div>{inc.className}</div>
                                <div className="text-xs text-gray-500">{inc.yearLevelName}</div>
                            </td>
                            <td>
                                {inc.category}
                            </td>
                            <td>
                                <div className="whitespace-pre-wrap">{inc.description}</div>
                                {(inc.involvedPersons || inc.witnesses) && (
                                    <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                                        {inc.involvedPersons && <div className="mb-1"><strong>Beteiligte:</strong> {inc.involvedPersons}</div>}
                                        {inc.witnesses && <div><strong>Zeugen:</strong> {inc.witnesses}</div>}
                                    </div>
                                )}
                            </td>
                            <td>
                                {inc.immediateActions && (
                                    <div className="mb-2">
                                        <strong>Maßnahme:</strong> {inc.immediateActions}
                                    </div>
                                )}
                                {inc.agreements && (
                                    <div className="mb-2">
                                        <strong>Verbleib:</strong> {inc.agreements}
                                    </div>
                                )}
                                <div className="mt-1 text-xs space-y-1">
                                    {inc.parentContacted && <div>☑ Eltern informiert</div>}
                                    {inc.administrationContacted && <div>☑ Schulleitung informiert</div>}
                                    {inc.socialServiceContacted && <div>☑ Schulsozialarbeit ({inc.socialServiceAbbreviation || 'k.A.'})</div>}
                                    {!inc.parentContacted && !inc.administrationContacted && !inc.socialServiceContacted && <div className="text-gray-400">Keine weiteren Stellen informiert</div>}
                                </div>
                            </td>
                            <td>
                                <span className="font-bold border border-gray-400 px-2 py-1 rounded inline-block text-xs uppercase tracking-wider">
                                    {inc.status}
                                </span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
        
        <div className="mt-8 text-xs text-gray-500 text-center border-t border-gray-300 pt-2 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
            Dokument generiert durch SchulKonflikt Manager - Vertrauliche Unterlage
        </div>
    </div>
  );
};