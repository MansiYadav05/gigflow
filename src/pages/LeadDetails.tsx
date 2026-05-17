import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Lead, LeadStatus } from "../types";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Mail, Tag, Share2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const { data } = await api.get(`/leads/${id}`);
        setLead(data.data);
      } catch (err) {
        toast.error("Lead not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead deleted");
      navigate("/");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  if (!lead) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <Link to="/" className="inline-flex items-center gap-2 text-text-hint hover:text-text-primary mb-8 transition-colors font-medium text-[13px]">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-md"
      >
        <div className="p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 ${
                lead.status === LeadStatus.QUALIFIED ? 'bg-status-qualified/10 text-status-qualified' :
                lead.status === LeadStatus.LOST ? 'bg-status-lost/10 text-status-lost' :
                lead.status === LeadStatus.CONTACTED ? 'bg-status-contacted/10 text-status-contacted' :
                'bg-status-new/10 text-status-new'
              }`}>
                {lead.status}
              </span>
              <h1 className="text-4xl font-bold text-text-primary capitalize">{lead.name}</h1>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-status-lost/20 text-status-lost rounded-lg hover:bg-status-lost/10 transition-colors text-sm font-medium"
              >
                <Trash2 size={16} /> Delete Lead
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-hint mb-4 font-mono">Contact Information</h3>
                <div className="flex items-center gap-4 text-text-secondary">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email Address</div>
                    <a href={`mailto:${lead.email}`} className="text-text-primary hover:underline">{lead.email}</a>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-hint mb-4 font-mono">Acquisition Source</h3>
                <div className="flex items-center gap-4 text-text-secondary">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Channel</div>
                    <div className="text-text-primary">{lead.source}</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-hint mb-4 font-mono">Timeline</h3>
                <div className="flex items-center gap-4 text-text-secondary">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Created On</div>
                    <div className="text-text-primary">{new Date(lead.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-hint mb-4 font-mono">Reference ID</h3>
                <div className="flex items-center gap-4 text-text-secondary">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                    <Tag size={18} />
                  </div>
                  <div className="font-mono text-sm break-all text-text-primary">
                    {lead._id}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
        
        <div className="bg-bg-elevated/30 p-6 flex items-center border-t border-border font-serif italic text-sm text-text-hint">
          <span>Last modified: {new Date(lead.updatedAt).toLocaleDateString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LeadDetails;
