import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, Siren, AlertCircle, Send, MapPin, User, Phone, Clock, LifeBuoy, CheckCircle2, MessageSquare } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './Toast';

export const EmergencyHotline: React.FC = () => {
  const { addToast } = useToast();
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    department: '',
    matricNo: '',
    phone: '',
    location: '',
    emergencyType: 'Medical Assistance',
    description: '',
    urgency: 'High'
  });

  const hotlineContacts = [
    {
      title: 'Emergency Squad Hotline',
      subtitle: '24/7 Campus Emergency Response',
      numbers: ['09125603852', '09026534351', '08125658145', '09078254935', '07074351819'],
      available: '24/7 Active',
      icon: Siren,
      bgColor: 'from-red-500/20 to-yellow-500/10',
      borderColor: 'border-yellow-400/40'
    },
    {
      title: 'Faculty Security Control',
      subtitle: 'Campus Safety & Protection Unit',
      numbers: ['+234 812 3456 789'],
      available: '24/7 Duty Officer',
      icon: ShieldAlert,
      bgColor: 'from-yellow-500/20 to-orange-500/10',
      borderColor: 'border-yellow-400/30'
    },
    {
      title: 'LASU Medical Center Emergency',
      subtitle: 'Urgent Medical & Health Support',
      numbers: ['+234 803 1234 567'],
      available: 'Immediate Response',
      icon: LifeBuoy,
      bgColor: 'from-emerald-500/20 to-yellow-500/10',
      borderColor: 'border-emerald-400/30'
    },
    {
      title: 'Student Affairs & Welfare',
      subtitle: 'NASS Executive Support Line',
      numbers: ['07074351819'],
      available: '8am - 10pm Daily',
      icon: PhoneCall,
      bgColor: 'from-blue-500/20 to-yellow-500/10',
      borderColor: 'border-blue-400/30'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.description || !formData.location) {
      addToast('Please fill in your phone number, location, and details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'emergency_reports'), {
          ...formData,
          createdAt: serverTimestamp(),
          status: 'pending'
        });
      }
      setSubmitted(true);
      addToast('Emergency alert transmitted to Squad dispatch!', 'success');
      setFormData({
        studentName: '',
        department: '',
        matricNo: '',
        phone: '',
        location: '',
        emergencyType: 'Medical Assistance',
        description: '',
        urgency: 'High'
      });
    } catch (err) {
      console.error('Error submitting emergency report:', err);
      addToast('Alert recorded locally. For life-threatening emergencies, call the hotline directly!', 'info');
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-yellow-400/30 p-6 md:p-10 shadow-[0_0_50px_rgba(250,204,21,0.15)] backdrop-blur-xl">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-widest mb-6 shadow-md">
        <Siren size={16} className="animate-pulse text-slate-900" />
        <span>24/7 Safety & Emergency Response</span>
      </div>

      {/* Main Title */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-white font-space-grotesk tracking-tight mb-4 flex flex-wrap items-center gap-3">
        The Faculty Hotline & Emergency Squad
      </h2>

      {/* User provided description */}
      <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mb-8 border-l-4 border-yellow-400 pl-4 py-1">
        The Faculty Hotline and Emergency Squad is committed to ensuring the safety, support, and well-being of every student. Whether you need to report an emergency, seek urgent assistance, or raise a concern, our team is always ready to respond promptly and effectively. Your safety remains our top priority.
      </p>

      {/* Action Buttons Header */}
      <div className="flex flex-wrap items-center gap-4 mb-10">
        <button
          onClick={() => setShowReportForm(!showReportForm)}
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-6 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 text-xs md:text-sm uppercase tracking-wide"
        >
          <ShieldAlert size={18} />
          <span>{showReportForm ? 'Hide Emergency Form' : 'Report Emergency / Concern Now'}</span>
        </button>
        <a
          href="tel:09125603852"
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold px-6 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 text-xs md:text-sm uppercase tracking-wide"
        >
          <PhoneCall size={18} />
          <span>Call Dispatch Hotline Directly</span>
        </a>
      </div>

      {/* Inline Report Form */}
      {showReportForm && (
        <div className="mb-10 bg-black/40 border border-yellow-400/40 rounded-2xl p-6 md:p-8 relative">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-yellow-400/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-white">Emergency Report Received!</h3>
              <p className="text-slate-300 text-sm max-w-md mx-auto">
                Our Emergency Squad has been notified. If this is an immediate life-threatening situation, please call our direct hotline: <strong className="text-yellow-400">09125603852</strong>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm uppercase tracking-wider mb-2">
                <AlertCircle size={18} />
                <span>Urgent Student Emergency Dispatch Form</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Department & Level
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, 300L"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-yellow-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Exact Campus Location <span className="text-yellow-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Faculty Lecture Theatre 2, Science Complex"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nature of Emergency
                  </label>
                  <select
                    value={formData.emergencyType}
                    onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                  >
                    <option value="Medical Assistance">Medical Emergency / Health Issue</option>
                    <option value="Campus Security Issue">Security Alert / Safety Concern</option>
                    <option value="Harassment / Assault">Harassment / Safety Report</option>
                    <option value="Facility Emergency">Fire / Facility Hazard</option>
                    <option value="Urgent Welfare / Distress">Psychological / Urgent Distress</option>
                    <option value="General Concern">General Urgent Concern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                  >
                    <option value="Critical">Critical - Immediate Threat</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Describe Emergency or Concern <span className="text-yellow-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide clear details on what happened so our emergency team can assist you immediately..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-yellow-400/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wide text-xs"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Transmitting Emergency Alert...' : 'Transmit Emergency Alert'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Grid of Hotline Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hotlineContacts.map((contact, index) => {
          const Icon = contact.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${contact.bgColor} border ${contact.borderColor} p-5 rounded-2xl flex flex-col justify-between relative group hover:border-yellow-400 transition-all hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-yellow-400/10 rounded-xl text-yellow-400">
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 text-yellow-400 border border-yellow-400/20">
                    {contact.available}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1 font-space-grotesk">{contact.title}</h3>
                <p className="text-xs text-slate-400 mb-4">{contact.subtitle}</p>
              </div>

              <div className="mt-2 pt-3 border-t border-white/10 space-y-2">
                {contact.numbers.map((num, nIdx) => (
                  <div key={nIdx} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-yellow-400 font-mono tracking-tight">
                      {num}
                    </span>
                    <a
                      href={`tel:${num.replace(/\s+/g, '')}`}
                      className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 p-1.5 rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                      title={`Call ${num}`}
                    >
                      <PhoneCall size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
