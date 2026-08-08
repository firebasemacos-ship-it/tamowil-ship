'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function TicketsList() {
  const { lang, tickets, updateTicketStatus, addTicketReply } = useApp();
  const isAr = lang === 'ar';

  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (activeTicket) {
      const updated = tickets.find(t => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [tickets]);

  const handleStatusChange = (id, status) => {
    updateTicketStatus(id, status);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    addTicketReply(activeTicket.id, replyText);
    setReplyText('');
  };

  const filteredTickets = tickets.filter(t => {
    return filterStatus === 'All' || t.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div>
        <h1 className="title-large">{isAr ? 'تذاكر الدعم الفني' : 'Merchant Support Tickets'}</h1>
        <p className="subtitle">
          {isAr
            ? 'مراجعة وحل المشاكل والاستفسارات المرفوعة من قبل أصحاب المتاجر.'
            : 'Review and resolve support questions and issues raised by store merchants.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
        {/* Column 1: Tickets list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status selector tab */}
          <div className="glass-card flex gap-2 justify-between" style={{ padding: '8px' }}>
            <button
              onClick={() => setFilterStatus('All')}
              className="text-[11px] font-bold flex-1 py-2 rounded-lg cursor-pointer"
              style={{
                backgroundColor: filterStatus === 'All' ? 'var(--primary-color)' : 'transparent',
                color: filterStatus === 'All' ? '#FFF' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterStatus('Open')}
              className="text-[11px] font-bold flex-1 py-2 rounded-lg cursor-pointer"
              style={{
                backgroundColor: filterStatus === 'Open' ? 'var(--accent-red)' : 'transparent',
                color: filterStatus === 'Open' ? '#FFF' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              {isAr ? 'مفتوحة' : 'Open'}
            </button>
            <button
              onClick={() => setFilterStatus('In Progress')}
              className="text-[11px] font-bold flex-1 py-2 rounded-lg cursor-pointer"
              style={{
                backgroundColor: filterStatus === 'In Progress' ? 'var(--accent-blue)' : 'transparent',
                color: filterStatus === 'In Progress' ? '#FFF' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              {isAr ? 'قيد المعالجة' : 'Progress'}
            </button>
            <button
              onClick={() => setFilterStatus('Closed')}
              className="text-[11px] font-bold flex-1 py-2 rounded-lg cursor-pointer"
              style={{
                backgroundColor: filterStatus === 'Closed' ? 'var(--text-secondary)' : 'transparent',
                color: filterStatus === 'Closed' ? '#FFF' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              {isAr ? 'مغلقة' : 'Closed'}
            </button>
          </div>

          {/* Tickets Cards Stack */}
          <div className="flex flex-col gap-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setActiveTicket(ticket)}
                className="glass-card cursor-pointer flex flex-col gap-3"
                style={{
                  borderLeft: activeTicket && activeTicket.id === ticket.id ? '4px solid var(--primary-color)' : '1px solid var(--card-border)',
                  borderRight: activeTicket && activeTicket.id === ticket.id ? '4px solid var(--primary-color)' : '1px solid var(--card-border)',
                  backgroundColor: activeTicket && activeTicket.id === ticket.id ? 'rgba(255,255,255,0.06)' : 'var(--card-bg)'
                }}
              >
                <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="font-bold text-xs" style={{ color: 'var(--text-tertiary)' }}>{ticket.id}</span>
                  <span 
                    className="badge text-[10px]"
                    style={{
                      backgroundColor: ticket.status === 'Open' ? 'rgba(239,68,68,0.15)' : ticket.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
                      color: ticket.status === 'Open' ? 'var(--accent-red)' : ticket.status === 'In Progress' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                    }}
                  >
                    {isAr
                      ? (ticket.status === 'Open' ? 'مفتوحة' : ticket.status === 'In Progress' ? 'قيد المعالجة' : 'مغلقة')
                      : ticket.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{ticket.subject}</h4>
                  <span className="text-[10px]" style={{ color: 'var(--primary-color)' }}>{ticket.userStore}</span>
                </div>
                <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                  {ticket.timestamp.toLocaleDateString()}
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-10 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {isAr ? 'لا توجد تذاكر دعم فني.' : 'No support tickets.'}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Ticket chat panel */}
        <div>
          {activeTicket ? (
            <div className="glass-card flex flex-col gap-5" style={{ minHeight: '60vh' }}>
              {/* Active Ticket Header details */}
              <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{activeTicket.id}</span>
                  <h3 className="text-sm font-bold my-1" style={{ color: 'var(--text-primary)' }}>{activeTicket.subject}</h3>
                  <span className="text-xs" style={{ color: 'var(--primary-color)' }}>{activeTicket.userStore}</span>
                </div>

                {/* Status selector Actions dropdown */}
                <div>
                  <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    {isAr ? 'تحديث حالة التذكرة' : 'Update Status'}
                  </label>
                  <select
                    className="glass-input text-xs"
                    style={{ width: '130px', padding: '8px' }}
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
                  >
                    <option value="Open">{isAr ? 'مفتوحة (Open)' : 'Open'}</option>
                    <option value="In Progress">{isAr ? 'قيد المعالجة (In Progress)' : 'In Progress'}</option>
                    <option value="Closed">{isAr ? 'مغلقة (Closed)' : 'Closed'}</option>
                  </select>
                </div>
              </div>

              {/* Message Details */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '40vh' }}>
                {/* Merchant Original Message */}
                <div 
                  className="p-4 rounded-xl border flex flex-col gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex justify-between text-[10px]" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                    <span className="font-bold">{activeTicket.userStore}</span>
                    <span>{activeTicket.timestamp ? new Date(activeTicket.timestamp).toLocaleString('ar-LY') : ''}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {activeTicket.details}
                  </p>
                </div>

                {/* Thread Replies */}
                {activeTicket.replies.map((reply, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border flex flex-col gap-2"
                    style={{
                      backgroundColor: reply.sender.includes('Admin') ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.01)',
                      borderColor: reply.sender.includes('Admin') ? 'var(--primary-color)' : 'var(--glass-border)',
                      alignSelf: reply.sender.includes('Admin') ? 'flex-end' : 'flex-start',
                      width: '90%'
                    }}
                  >
                    <div className="flex justify-between text-[10px]" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                      <span className="font-bold" style={{ color: reply.sender.includes('Admin') ? 'var(--primary-color)' : 'var(--text-secondary)' }}>{reply.sender}</span>
                      <span>{reply.timestamp ? new Date(reply.timestamp).toLocaleString('ar-LY') : ''}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                      {reply.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply composition editor */}
              {activeTicket.status !== 'Closed' ? (
                <form onSubmit={handleSendReply} className="flex gap-3 border-t pt-4" style={{ borderColor: 'var(--glass-border)' }}>
                  <input
                    type="text"
                    required
                    className="glass-input flex-1"
                    placeholder={isAr ? 'اكتب رد المسؤول هنا...' : 'Type admin response here...'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button type="submit" className="glass-button text-xs" style={{ padding: '0 20px' }}>
                    {isAr ? 'إرسال الرد' : 'Send'}
                  </button>
                </form>
              ) : (
                <div 
                  className="p-3 rounded-lg text-center text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--text-tertiary)' }}
                >
                  {isAr ? 'تم إغلاق هذه التذكرة. لا يمكن إرسال المزيد من الردود.' : 'This ticket is closed. No further replies can be sent.'}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card flex items-center justify-center text-center font-semibold" style={{ minHeight: '60vh', color: 'var(--text-tertiary)' }}>
              {isAr ? 'يرجى اختيار تذكرة دعم فني من القائمة لعرض المحادثة والرد.' : 'Please select a support ticket from the list to view and reply.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
