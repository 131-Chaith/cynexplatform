import React from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Card';
import Button from '../Button';
import { Github, CheckCircle, ExternalLink } from 'lucide-react';

const ProjectApprovals = () => {
    const { data, approveProject } = useData();
    const { projects = [] } = data; // For admin, this contains pending projects

    const handleApprove = async (projectId) => {
        if (window.confirm("Approve this project?")) {
            await approveProject(projectId);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.5rem' }}>
                    Project Approvals
                </h1>
                <p style={{ color: 'var(--text-light)' }}>
                    Review and approve student project submissions.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {projects.map(project => (
                    <Card key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text)' }}>{project.title}</h3>
                                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {project.status}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                Student: <span style={{ fontWeight: '600' }}>{project.student_name}</span> • Course: {project.course_title}
                            </p>
                            <a href={project.repo_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'none' }}>
                                <Github size={14} /> View Repository <ExternalLink size={12} />
                            </a>
                        </div>
                        <Button onClick={() => handleApprove(project.id)} variant="secondary" size="small">
                            <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Approve
                        </Button>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--light)', borderRadius: '0.5rem' }}>
                        <p style={{ color: 'var(--text-light)' }}>No pending project submissions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectApprovals;
