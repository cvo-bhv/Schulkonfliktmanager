import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight, User, Users, Folder } from 'lucide-react';
import * as Storage from '../services/storage';
import { YearLevel, SchoolClass, Student } from '../types';

export const StructureManagement: React.FC = () => {
  const [years, setYears] = useState<YearLevel[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // UI State for inputs
  const [newYearName, setNewYearName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newStudentFirst, setNewStudentFirst] = useState('');
  const [newStudentLast, setNewStudentLast] = useState('');

  const refreshData = async () => {
    const loadedYears = await Storage.getYears();
    setYears(loadedYears);
    
    if (selectedYear) {
      const loadedClasses = await Storage.getClassesByYear(selectedYear);
      setClasses(loadedClasses);
    } else {
        setClasses([]);
    }
    
    if (selectedClass) {
      const loadedStudents = await Storage.getStudentsByClass(selectedClass);
      setStudents(loadedStudents);
    } else {
        setStudents([]);
    }
  };

  useEffect(() => {
    refreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedClass]);

  // Handlers
  const handleAddYear = async () => {
    if (!newYearName.trim()) return;
    await Storage.saveYear(newYearName);
    setNewYearName('');
    refreshData();
  };

  const handleDeleteYear = async (id: string) => {
    if (confirm('Sind Sie sicher? Alle Klassen und Schüler in diesem Jahrgang werden gelöscht (Simulation).')) {
      await Storage.deleteYear(id);
      if (selectedYear === id) setSelectedYear(null);
      refreshData();
    }
  };

  const handleAddClass = async () => {
    if (!selectedYear || !newClassName.trim()) return;
    await Storage.saveClass(selectedYear, newClassName);
    setNewClassName('');
    refreshData();
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm('Klasse wirklich löschen?')) {
      await Storage.deleteClass(id);
      if (selectedClass === id) setSelectedClass(null);
      refreshData();
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClass || !newStudentFirst.trim() || !newStudentLast.trim()) return;
    await Storage.saveStudent(selectedClass, newStudentFirst, newStudentLast);
    setNewStudentFirst('');
    setNewStudentLast('');
    refreshData();
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Schüler wirklich löschen?')) {
        await Storage.deleteStudent(id);
        refreshData();
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Column 1: Years */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
            <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap">
                <Folder className="w-5 h-5 mr-2 text-blue-500"/> Jahrgänge
            </h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              placeholder="z.B. Jahrgang 5"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleAddYear}
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {years.map(year => (
            <div
              key={year.id}
              onClick={() => { setSelectedYear(year.id); setSelectedClass(null); }}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${selectedYear === year.id ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className="font-medium truncate mr-2">{year.name}</span>
              <div className="flex items-center space-x-2 flex-shrink-0">
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteYear(year.id); }} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                 </button>
                 <ChevronRight className={`w-4 h-4 ${selectedYear === year.id ? 'text-blue-500' : 'text-gray-300'}`} />
              </div>
            </div>
          ))}
          {years.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Jahrgänge</p>}
        </div>
      </div>

      {/* Column 2: Classes */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0 ${!selectedYear ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
             <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap">
                <Users className="w-5 h-5 mr-2 text-indigo-500"/> Klassen
            </h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="z.B. 5a"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={handleAddClass}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {classes.map(cls => (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${selectedClass === cls.id ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className="font-medium truncate mr-2">{cls.name}</span>
              <div className="flex items-center space-x-2 flex-shrink-0">
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                 </button>
                 <ChevronRight className={`w-4 h-4 ${selectedClass === cls.id ? 'text-indigo-500' : 'text-gray-300'}`} />
              </div>
            </div>
          ))}
           {selectedYear && classes.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Klassen im Jahrgang</p>}
        </div>
      </div>

      {/* Column 3: Students */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0 ${!selectedClass ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap">
                <User className="w-5 h-5 mr-2 text-emerald-500"/> Schüler:innen
            </h2>
        </div>
        
        {/* Adjusted Input Area: Stacked to fit in narrow columns */}
        <div className="p-4 border-b border-gray-100 space-y-3">
            <input
              type="text"
              value={newStudentFirst}
              onChange={(e) => setNewStudentFirst(e.target.value)}
              placeholder="Vorname"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          <div className="flex space-x-2">
             <input
              type="text"
              value={newStudentLast}
              onChange={(e) => setNewStudentLast(e.target.value)}
              placeholder="Nachname"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={handleAddStudent}
              className="bg-emerald-600 text-white p-2 rounded-md hover:bg-emerald-700 transition flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {students.map(student => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 group"
            >
              <span className="text-gray-700 truncate min-w-0 flex-1 mr-2">
                {student.firstName} <strong>{student.lastName}</strong>
              </span>
               <button onClick={() => handleDeleteStudent(student.id)} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
               </button>
            </div>
          ))}
          {selectedClass && students.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Schüler in dieser Klasse</p>}
        </div>
      </div>

    </div>
  );
};