import React from 'react';
import { GraduationCap, LogOut, UserCheck, User, Building2 } from 'lucide-react';
import { CurrentUser } from '../types';
import { StudentLogo } from './StudentLogo';

interface HeaderProps {
  currentUser: CurrentUser | null;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenDbControl?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
}) => {
  return (
    <header className="bg-[#0B2238] text-white pt-5 pb-6 px-4 md:px-8 shadow-md relative transition-all border-b border-blue-900/50 print:hidden">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* College Logo & Title */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group text-center sm:text-left"
        >
          <div className="w-12 h-12 bg-white/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner transition-colors">
            <GraduationCap className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-widest uppercase text-white leading-tight">
              JAYA SAKTHI
            </h1>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-blue-200/90">
              ENGINEERING COLLEGE • ACADEMIC PORTAL
            </p>
          </div>
        </div>

        {/* User Session Info / Action Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                {currentUser.photoUrl ||
                currentUser.studentData?.photoUrl ||
                currentUser.staffData?.photoUrl ||
                currentUser.hodData?.photoUrl ? (
                  <img
                    src={
                      currentUser.photoUrl ||
                      currentUser.studentData?.photoUrl ||
                      currentUser.staffData?.photoUrl ||
                      currentUser.hodData?.photoUrl
                    }
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-300 shadow-xs"
                  />
                ) : currentUser.role === 'student' ? (
                  <StudentLogo size="sm" className="w-7 h-7" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                    {currentUser.role === 'hod' ? (
                      <Building2 className="w-4 h-4 text-[#0B2238]" />
                    ) : currentUser.role === 'staff' ? (
                      <UserCheck className="w-4 h-4 text-[#0B2238]" />
                    ) : (
                      <Building2 className="w-4 h-4 text-[#0B2238]" />
                    )}
                  </div>
                )}
                <div className="text-left">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono uppercase">
                    {currentUser.role === 'hod'
                      ? `HOD (${currentUser.department})`
                      : currentUser.role === 'staff'
                      ? `STAFF (${currentUser.department})`
                      : currentUser.role === 'exam_cell'
                      ? 'EXAM CELL (COE)'
                      : `REG: ${currentUser.id}`}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-white/20 text-blue-200 hover:text-white rounded-full transition-colors cursor-pointer"
                title="Sign Out"
                id="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:block text-xs text-blue-200/80 font-mono">
              Anna University Affiliated
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

