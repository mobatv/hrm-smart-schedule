import React, { useState, useMemo } from 'react';

const SHIFTS = [
  { id: 'ca1', label: 'C1', fullLabel: 'Ca 1 (06:00 - 14:00)', activeClass: 'bg-blue-600 text-white border-blue-600', inactiveClass: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-600' },
  { id: 'ca2', label: 'C2', fullLabel: 'Ca 2 (14:00 - 22:00)', activeClass: 'bg-emerald-600 text-white border-emerald-600', inactiveClass: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600' },
  { id: 'ca3', label: 'C3', fullLabel: 'Ca 3 (22:00 - 06:00)', activeClass: 'bg-amber-600 text-white border-amber-600', inactiveClass: 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600' },
];

const DAYS = [
  { id: 't2', label: 'T2' },
  { id: 't3', label: 'T3' },
  { id: 't4', label: 'T4' },
  { id: 't5', label: 'T5' },
  { id: 't6', label: 'T6' },
  { id: 't7', label: 'T7' },
  { id: 'cn', label: 'CN' },
];

export default function ShiftScheduler() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Ngọc Hào', schedule: { t2: ['ca2', 'ca3'], t3: [], t4: [], t5: [], t6: [], t7: [], cn: [] } },
    { id: 2, name: 'Anh Bình', schedule: { t2: ['ca1', 'ca2'], t3: ['ca1'], t4: ['ca1'], t5: [], t6: [], t7: [], cn: [] } },
    { id: 3, name: 'Anh Đĩnh', schedule: { t2: [], t3: [], t4: [], t5: [], t6: [], t7: [], cn: [] } },
    { id: 4, name: 'Anh Vũ', schedule: { t2: [], t3: [], t4: [], t5: [], t6: [], t7: [], cn: [] } },
    { id: 5, name: 'Anh Chiến', schedule: { t2: [], t3: [], t4: [], t5: ['ca1'], t6: [], t7: [], cn: [] } },
    { id: 6, name: 'Anh Tú', schedule: { t2: ['ca1', 'ca2'], t3: [], t4: ['ca1', 'ca2'], t5: [], t6: [], t7: [], cn: [] } },
    { id: 7, name: 'Anh Hậu', schedule: { t2: ['ca1', 'ca2'], t3: ['ca1', 'ca2'], t4: [], t5: [], t6: [], t7: [], cn: [] } },
  ]);

  // Chọn hoặc bỏ chọn ca
  const toggleShift = (empId, dayId, shiftId) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      const currentDayShifts = emp.schedule[dayId] || [];
      const hasShift = currentDayShifts.includes(shiftId);
      const updatedDayShifts = hasShift 
        ? currentDayShifts.filter(s => s !== shiftId)
        : [...currentDayShifts, shiftId];
      
      return { ...emp, schedule: { ...emp.schedule, [dayId]: updatedDayShifts } };
    }));
  };

  // Thêm nhân viên mới
  const addEmployee = (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const newEmp = {
      id: Date.now(),
      name: newEmpName.trim(),
      schedule: { t2: [], t3: [], t4: [], t5: [], t6: [], t7: [], cn: [] }
    };
    setEmployees(prev => [...prev, newEmp]);
    setNewEmpName('');
  };

  // Xóa nhân viên
  const deleteEmployee = (empId) => {
    setEmployees(prev => prev.filter(emp => emp.id !== empId));
  };

  // Áp dụng mẫu Ca Hành Chính (Ca 1 từ T2 - T6)
  const applyPresetOffice = (empId) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      return {
        ...emp,
        schedule: { t2: ['ca1'], t3: ['ca1'], t4: ['ca1'], t5: ['ca1'], t6: ['ca1'], t7: [], cn: [] }
      };
    }));
  };

  // Xóa toàn bộ ca của một nhân viên trong tuần
  const clearSchedule = (empId) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      return {
        ...emp,
        schedule: { t2: [], t3: [], t4: [], t5: [], t6: [], t7: [], cn: [] }
      };
    }));
  };

  // Kiểm tra cảnh báo vi phạm ca làm
  const getEmpWarnings = (schedule) => {
    const warnings = [];
    DAYS.forEach(day => {
      if ((schedule[day.id] || []).length >= 3) {
        warnings.push(`${day.label}: Làm cả 3 ca trong 1 ngày`);
      }
    });

    for (let i = 0; i < DAYS.length - 1; i++) {
      const today = DAYS[i].id;
      const nextDay = DAYS[i + 1].id;
      if ((schedule[today] || []).includes('ca3') && (schedule[nextDay] || []).includes('ca1')) {
        warnings.push(`Thiếu nghỉ: ${DAYS[i].label} làm Ca 3 -> ${DAYS[i+1].label} làm Ca 1`);
      }
    }
    return warnings;
  };

  // Xuất file CSV / Excel
  const exportCSV = () => {
    let csv = '\uFEFFNhan Vien,T2,T3,T4,T5,T6,T7,CN,Tong Ca\n';
    employees.forEach(emp => {
      const row = [
        `"${emp.name}"`,
        ...DAYS.map(day => `"${(emp.schedule[day.id] || []).map(s => s.toUpperCase()).join('+')}"`),
        getEmpTotalShifts(emp.schedule)
      ];
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lich_phan_ca.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lọc theo tên nhân viên
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  // Tính tổng số ca làm
  const getEmpTotalShifts = (schedule) => {
    return Object.values(schedule || {}).reduce((acc, shifts) => acc + (shifts || []).length, 0);
  };

  // Thống kê định biên theo ca ở Footer
  const shiftStats = useMemo(() => {
    const stats = {};
    DAYS.forEach(day => {
      stats[day.id] = { ca1: 0, ca2: 0, ca3: 0 };
      employees.forEach(emp => {
        (emp.schedule[day.id] || []).forEach(shiftId => {
          if (stats[day.id][shiftId] !== undefined) stats[day.id][shiftId]++;
        });
      });
    });
    return stats;
  }, [employees]);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        
        {/* Header & Thanh công cụ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-800">Bảng Xếp Ca Làm Việc Smart HRM</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportCSV}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            >
              📥 Xuất File Excel/CSV
            </button>

            <form onSubmit={addEmployee} className="flex gap-2">
              <input
                type="text"
                placeholder="Tên nhân viên..."
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                + Thêm
              </button>
            </form>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chú thích */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <span>Chú thích:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> C1: Ca 1</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> C2: Ca 2</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span> C3: Ca 3</span>
          <span className="ml-auto text-amber-600 font-semibold">⚠️ Biểu tượng cảnh báo vi phạm lịch nghỉ</span>
        </div>

        {/* Bảng xếp ca */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-semibold border-b">
                <th className="p-3 min-w-[140px]">NHÂN VIÊN</th>
                {DAYS.map(day => (
                  <th key={day.id} className="p-3 text-center min-w-[100px]">{day.label}</th>
                ))}
                <th className="p-3 text-center min-w-[80px]">TỔNG CA</th>
                <th className="p-3 text-center min-w-[140px]">MẪU CA / HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-500">Không tìm thấy nhân viên phù hợp</td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const totalShifts = getEmpTotalShifts(emp.schedule);
                  const warnings = getEmpWarnings(emp.schedule);
                  const hasWarning = warnings.length > 0;

                  return (
                    <tr key={emp.id} className={`border-b transition-colors ${hasWarning ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="p-3 font-medium text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {hasWarning && (
                            <span className="cursor-pointer text-amber-600" title={warnings.join('\n')}>
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                      {DAYS.map(day => (
                        <td key={day.id} className="p-2 text-center">
                          <div className="flex justify-center gap-1">
                            {SHIFTS.map(shift => {
                              const active = emp.schedule[day.id]?.includes(shift.id);
                              return (
                                <button
                                  key={shift.id}
                                  type="button"
                                  title={shift.fullLabel}
                                  onClick={() => toggleShift(emp.id, day.id, shift.id)}
                                  className={`w-7 h-7 text-xs font-semibold rounded border transition-all flex items-center justify-center ${
                                    active ? shift.activeClass : shift.inactiveClass
                                  }`}
                                >
                                  {shift.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-gray-700">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${totalShifts > 10 ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>
                          {totalShifts}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => applyPresetOffice(emp.id)}
                            className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                            title="Xếp ca 1 từ T2 - T6"
                          >
                            H.Chính
                          </button>
                          <button
                            type="button"
                            onClick={() => clearSchedule(emp.id)}
                            className="px-2 py-1 text-[11px] bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                            title="Xóa hết ca tuần này"
                          >
                            Xóa ca
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEmployee(emp.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                            title="Xóa nhân viên"
                          >
                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Dòng Thống kê định biên (Footer) */}
            <tfoot>
              <tr className="bg-slate-100 font-medium text-gray-700 border-t-2 border-gray-300">
                <td className="p-3 font-bold">Tổng nhân sự/ca</td>
                {DAYS.map(day => (
                  <td key={day.id} className="p-2 text-center">
                    <div className="text-[11px] space-y-0.5 font-medium">
                      <div className="text-blue-700">C1: {shiftStats[day.id].ca1}</div>
                      <div className="text-emerald-700">C2: {shiftStats[day.id].ca2}</div>
                      <div className="text-amber-700">C3: {shiftStats[day.id].ca3}</div>
                    </div>
                  </td>
                ))}
                <td className="p-3 text-center font-bold text-gray-800">
                  {Object.values(shiftStats).reduce((sum, d) => sum + d.ca1 + d.ca2 + d.ca3, 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
}