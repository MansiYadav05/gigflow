import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../lib/api";
import { Lead, LeadStatus, LeadSource, PaginatedResponse, DashboardStats } from "../../types";
import { toast } from "sonner";
import {
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Filter, Edit2, Trash2, Users, TrendingUp, Check, X, RotateCcw, Inbox, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { exportLeadsToCSV } from "../../utils/exportCSV";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Lead>["meta"] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Partial<Lead> | null>(null);

  // Filter states from URL
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page") || "1");

  const debouncedSearch = useDebounce(search, 400);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: debouncedSearch, status, source, sort, page };
      const { data } = await api.get<PaginatedResponse<Lead>>("/leads", { params });
      setLeads(data.data);
      setMeta(data.meta);
    } catch (err) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, source, sort, page]);

  const fetchStats = async () => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await api.get("/stats");
      setStats(data.data);
    } catch (err) {
      console.error("Stats error", err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const updateFilters = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === undefined) newParams.delete(key);
      else newParams.set(key, String(value));
    });
    if (!updates.page) newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = search || status || source || sort !== 'latest' || page !== 1;

  const handleExport = async () => {
    try {
      const params = { search: debouncedSearch, status, source };
      const { data } = await api.get("/leads/export", { params });
      exportLeadsToCSV(data.data);
      toast.success("Leads exported successfully");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action is irreversible.")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead removed");
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error("Delete permission denied");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentLead?._id) {
        await api.put(`/leads/${currentLead._id}`, currentLead);
        toast.success("Changes saved");
      } else {
        await api.post("/leads", currentLead);
        toast.success("New lead created");
      }
      setIsModalOpen(false);
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error("Submission failed");
    }
  };

  return (
    <div className="min-h-screen px-3 sm:px-6 md:px-10 py-6 md:py-10 pb-20">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-1 truncate">Leads Dashboard</h1>
            <p className="text-text-secondary text-[13px] line-clamp-2">Manage your sales pipeline and conversion efficiency</p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
            <button onClick={handleExport} className="btn-secondary text-sm sm:text-base order-2 xs:order-1">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => { setCurrentLead({ status: LeadStatus.NEW, source: LeadSource.WEBSITE }); setIsModalOpen(true); }}
              className="btn-primary text-sm sm:text-base order-1 xs:order-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Lead</span>
            </button>
          </div>
        </header>

        {/* Stats Grid (Admin Only) */}
        {user?.role === 'admin' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8">
            <StatCard icon={<Users size={18} />} label="Total" value={stats.totalLeads} />
            <StatCard icon={<Check size={18} />} label="Qualified" value={stats.qualifiedLeads} />
            <StatCard icon={<TrendingUp size={18} />} label="New" value={stats.newThisWeek} />
            <StatCard icon={<X size={18} />} label="Lost" value={stats.lostLeads} />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-bg-surface border border-border rounded-xl p-3 sm:p-4 mb-6 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[160px] sm:min-w-[200px] relative order-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-hint" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors placeholder:text-text-hint"
            />
          </div>

          {/* Mobile Filters Toggle */}
          <div className="hidden xs:flex xs:gap-2 xs:flex-wrap order-2">
            <select
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="bg-bg-input border border-border rounded-lg h-9 px-3 text-[12px] sm:text-[13px] text-text-secondary outline-none focus:border-border-focus"
            >
              <option value="">Status</option>
              {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={source}
              onChange={(e) => updateFilters({ source: e.target.value })}
              className="bg-bg-input border border-border rounded-lg h-9 px-3 text-[12px] sm:text-[13px] text-text-secondary outline-none focus:border-border-focus"
            >
              <option value="">Source</option>
              {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="bg-bg-input border border-border rounded-lg h-9 px-3 text-[12px] sm:text-[13px] text-text-secondary outline-none focus:border-border-focus"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-text-hint hover:text-text-primary text-[12px] flex items-center gap-1 px-2.5 py-2 rounded-lg bg-bg-input border border-border hover:bg-bg-elevated transition-colors"
                title="Clear all filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Mobile Filters Stacked */}
          <div className="xs:hidden flex flex-col gap-2 w-full order-3">
            <select
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full bg-bg-input border border-border rounded-lg h-9 px-3 text-[13px] text-text-secondary outline-none focus:border-border-focus"
            >
              <option value="">All Statuses</option>
              {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex gap-2">
              <select
                value={source}
                onChange={(e) => updateFilters({ source: e.target.value })}
                className="flex-1 bg-bg-input border border-border rounded-lg h-9 px-3 text-[13px] text-text-secondary outline-none focus:border-border-focus"
              >
                <option value="">All Sources</option>
                {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="flex-1 bg-bg-input border border-border rounded-lg h-9 px-3 text-[13px] text-text-secondary outline-none focus:border-border-focus"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-lg bg-bg-input border border-border text-text-hint hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  title="Clear all filters"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-full">
              <thead>
                <tr className="bg-bg-elevated border-b border-border text-[12px] sm:text-[13px]">
                  <th className="px-3 sm:px-6 py-3 text-left col-header">Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left col-header hidden sm:table-cell">Email Address</th>
                  <th className="px-3 sm:px-6 py-3 text-left col-header">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left col-header hidden md:table-cell">Source</th>
                  <th className="px-3 sm:px-6 py-3 text-left col-header hidden lg:table-cell">Created At</th>
                  <th className="px-3 sm:px-6 py-3 text-right col-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows count={10} />
                ) : leads.length > 0 ? (
                  leads.map((lead, i) => (
                    <tr
                      key={lead._id}
                      className={`border-b border-border data-row hover:bg-accent-soft group text-[12px] sm:text-[13px] ${i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated/30'}`}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-text-secondary group-hover:bg-accent/20 group-hover:text-accent transition-colors flex-shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <Link to={`/leads/${lead._id}`} className="font-medium text-text-primary hover:text-accent transition-colors line-clamp-1">
                            {lead.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-text-secondary hidden sm:table-cell truncate">
                        {lead.email}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-text-secondary hidden md:table-cell">
                        {lead.source}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] text-text-hint hidden lg:table-cell">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Link
                            to={`/leads/${lead._id}`}
                            title="View Details"
                            className="w-7 h-7 flex items-center justify-center bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => { setCurrentLead(lead); setIsModalOpen(true); }}
                            className="w-7 h-7 flex items-center justify-center bg-bg-elevated text-text-secondary hover:text-accent rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(lead._id)}
                              className="w-7 h-7 flex items-center justify-center bg-bg-elevated text-text-secondary hover:text-status-lost rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-hint">
                        <Inbox size={48} className="opacity-20" />
                        <div>
                          <p className="text-text-primary font-medium">No leads found</p>
                          <p className="text-[12px]">Try adjusting your filters or add a new lead</p>
                        </div>
                        <button
                          onClick={() => { setCurrentLead({ status: LeadStatus.NEW, source: LeadSource.WEBSITE }); setIsModalOpen(true); }}
                          className="btn-primary h-9 text-[12px] mt-2"
                        >
                          Add Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table >
          </div >
        </div >

        {/* Pagination */}
        {
          meta && meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:text-text-hint disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(meta.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateFilters({ page: i + 1 })}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${page === i + 1
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'bg-bg-surface border border-border text-text-secondary hover:bg-bg-elevated'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === meta.totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-bg-surface text-text-secondary hover:bg-bg-elevated disabled:text-text-hint disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )
        }

        {/* Modal Overlay */}
        <AnimatePresence mode="wait">
          {isModalOpen && (
            <div key="modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-[480px] bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-7">
                  <h2 className="text-lg font-semibold text-text-primary mb-1">
                    {currentLead?._id ? 'Edit Lead' : 'Create New Lead'}
                  </h2>
                  <p className="text-[13px] text-text-secondary mb-8">
                    Enter the details of the prospective client below
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <FormInput
                      label="Full Name"
                      value={currentLead?.name || ""}
                      onChange={v => setCurrentLead({ ...currentLead, name: v })}
                      required
                    />
                    <FormInput
                      label="Email address"
                      type="email"
                      value={currentLead?.email || ""}
                      onChange={v => setCurrentLead({ ...currentLead, email: v })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect
                        label="Status"
                        value={currentLead?.status || LeadStatus.NEW}
                        onChange={v => setCurrentLead({ ...currentLead, status: v as LeadStatus })}
                        options={Object.values(LeadStatus)}
                      />
                      <FormSelect
                        label="Source"
                        value={currentLead?.source || LeadSource.WEBSITE}
                        onChange={v => setCurrentLead({ ...currentLead, source: v as LeadSource })}
                        options={Object.values(LeadSource)}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2 text-text-secondary font-medium hover:text-text-primary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        {currentLead?._id ? 'Save changes' : 'Create Lead'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div >
      );
};

      // Sub-components
      const StatCard = ({icon, label, value}: {icon: React.ReactNode, label: string, value: number }) => (
      <div className="bg-bg-surface border border-border rounded-[10px] p-4 flex items-center gap-4">
        <div className="w-[34px] h-[34px] rounded-full bg-accent-soft flex items-center justify-center text-accent">
          {icon}
        </div>
        <div>
          <p className="text-text-secondary text-[11px] font-medium leading-tight mb-0.5">{label}</p>
          <p className="text-text-primary text-[20px] font-bold leading-tight">{value}</p>
        </div>
      </div>
      );

      const StatusBadge = ({status}: {status: LeadStatus }) => {
  const styles = {
        [LeadStatus.NEW]: {bg: 'bg-status-new/10', text: 'text-status-new', dot: 'bg-status-new' },
      [LeadStatus.CONTACTED]: {bg: 'bg-status-contacted/10', text: 'text-status-contacted', dot: 'bg-status-contacted' },
      [LeadStatus.QUALIFIED]: {bg: 'bg-status-qualified/10', text: 'text-status-qualified', dot: 'bg-status-qualified' },
      [LeadStatus.LOST]: {bg: 'bg-status-lost/10', text: 'text-status-lost', dot: 'bg-status-lost' },
  }[status];

      return (
      <span className={`inline-flex items-center gap-1.5 px-[10px] py-[4px] rounded-full text-[10px] font-semibold ${styles.bg} ${styles.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {status}
      </span>
      );
};

      const SkeletonRows = ({count}: {count: number }) => (
      <>
        {[...Array(count)].map((_, i) => (
          <tr key={i} className="border-b border-border animate-shimmer">
            <td colSpan={6} className="px-6 py-[18px]">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-elevated" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2 bg-bg-elevated rounded w-1/4" />
                  <div className="h-2 bg-bg-elevated rounded w-1/3 opacity-50" />
                </div>
              </div>
            </td>
          </tr>
        ))}
      </>
      );

      interface FormInputProps {
        label: string;
      value: string;
  onChange: (val: string) => void;
      type?: string;
      required?: boolean;
}

      const FormInput = ({label, value, onChange, type = "text", required}: FormInputProps) => (
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">{label}</label>
        <input
          type={type}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
        />
      </div>
      );

      interface FormSelectProps {
        label: string;
      value: string;
  onChange: (val: string) => void;
      options: string[];
}

      const FormSelect = ({label, value, onChange, options}: FormSelectProps) => (
      <div>
        <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">{label}</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-3 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
        >
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      );

      export default Dashboard;
