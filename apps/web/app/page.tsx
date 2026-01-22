'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type EmailStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    status: EmailStatus;
    createdAt: string;
    scheduledAt: string;
    sender?: string;
    error?: string;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [emails, setEmails] = useState<Email[]>([]);
    const [formData, setFormData] = useState({
        to: '',
        subject: '',
        body: '',
        scheduledAt: '',
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEmails = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/emails`);
            if (res.ok) {
                const data = await res.json();
                setEmails(data);
            }
        } catch (error) {
            console.error('Failed to fetch emails', error);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchEmails();
            const interval = setInterval(fetchEmails, 5000); // Polling for status updates
            return () => clearInterval(interval);
        }
    }, [status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    sender: session?.user?.email || 'authenticated-user'
                }),
            });

            if (res.ok) {
                setFormData({ to: '', subject: '', body: '', scheduledAt: '' });
                fetchEmails();
                showToast('Email scheduled successfully!', 'success');
            } else {
                showToast('Failed to schedule email.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-indigo-400">Loading Email Scheduler...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen font-sans">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    } backdrop-blur-sm`}>
                    <span className="text-xl">{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-10">
                {/* Header */}
                <header className="glass rounded-xl p-4 flex justify-between items-center sticky top-4 z-40 bg-black/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <span className="text-xl font-bold text-white">E</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Email <span className="text-indigo-400 font-light">Scheduler</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-white">{session.user?.name}</p>
                            <p className="text-xs text-indigo-300">{session.user?.email}</p>
                        </div>
                        <img
                            src={session.user?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${session.user?.email || 'User'}`}
                            alt={session.user?.name || 'User'}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/50 bg-indigo-900"
                        />
                        <button
                            onClick={() => signOut()}
                            className="text-sm bg-white/5 hover:bg-red-500/20 text-indigo-200 hover:text-red-400 px-4 py-2 rounded-lg transition-colors border border-white/5"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Schedule Email Form */}
                    <section className="glass-card p-6 lg:col-span-1 border-t-4 border-t-indigo-500">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            Compose
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Recipient</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="friend@example.com"
                                    className="input-field"
                                    value={formData.to}
                                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Hello there..."
                                    className="input-field"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Schedule For (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Write your message here..."
                                    className="input-field resize-none"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full group overflow-hidden relative"
                            >
                                <span className="relative z-10">{loading ? 'Scheduling...' : 'Schedule Email'}</span>
                                {loading && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                            </button>
                        </form>
                    </section>

                    {/* Email List */}
                    <section className="glass-card p-6 lg:col-span-2 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                History
                                <span className="bg-indigo-600/20 text-indigo-400 text-xs py-0.5 px-2 rounded-full border border-indigo-500/20">{emails.length}</span>
                            </h2>
                            <button onClick={fetchEmails} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors" title="Refresh">
                                ↻
                            </button>
                        </div>

                        <div className="overflow-x-auto flex-grow custom-scrollbar">
                            <div className="inline-block min-w-full align-middle">
                                {emails.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">
                                        <p className="text-lg">No emails scheduled yet.</p>
                                        <p className="text-sm opacity-60">Create your first campaign on the left.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-white/5 rounded-tl-lg">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-white/5">To</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-white/5">Subject</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-white/5">Scheduled</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-white/5 rounded-tr-lg">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {emails.map((email) => (
                                                <tr key={email.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border shadow-sm
                                                            ${email.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ''}
                                                            ${email.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : ''}
                                                            ${email.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse' : ''}
                                                            ${email.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : ''}
                                                        `}>
                                                            {email.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">{email.to}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors font-medium">{email.subject}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                                                        {new Date(email.scheduledAt).toLocaleDateString()} <span className="text-xs opacity-60">{new Date(email.scheduledAt).toLocaleTimeString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                                                        {new Date(email.createdAt).toLocaleDateString()} <span className="text-xs opacity-60">{new Date(email.createdAt).toLocaleTimeString()}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
