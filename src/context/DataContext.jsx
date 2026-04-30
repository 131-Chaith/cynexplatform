import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();
    const [data, setData] = useState({
        students: [],
        courses: [],
        certificates: [],
        submissions: [],
        testResults: [],
        certificateRequests: [],
        projects: []
    });

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        try {
            // always fetch courses
            const coursesRes = await api.get('courses');

            let newData = {
                courses: coursesRes.data,
                students: [],
                certificates: [],
                submissions: [],
                testResults: [],
                certificateRequests: [],
                projects: []
            };

            if (currentUser) {
                if (!isAdmin) {
                    // Student Info
                    const certsRes = await api.get('students/certificates');
                    const projectsRes = await api.get('projects');

                    newData = {
                        ...newData,
                        certificates: certsRes.data,
                        projects: projectsRes.data
                    };
                } else {
                    // Admin Info
                    try {
                        const certRequestsRes = await api.get('admin/certificates/requests');
                        const pendingProjectsRes = await api.get('projects/pending'); 

                        newData = {
                            ...newData,
                            certificateRequests: certRequestsRes.data,
                            // We can store pending projects in projects for admin view or a separate field
                            projects: pendingProjectsRes.data
                        };
                    } catch (err) {
                        console.error("Failed to fetch admin data", err);
                    }
                }
            }
            setData(prev => ({ ...prev, ...newData }));
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    }, [currentUser, isAdmin]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveData = (key, data) => {
        // Placeholder for legacy calls or specific updates
        console.warn("saveData called but not fully implemented with API", key);
    };

    const submitAssignment = async (studentId, assignmentId, submissionLink) => {
        try {
            await api.post('students/assignments/submit', { assignment_id: assignmentId, submission_link: submissionLink });
            // Ideally refetch assignments or update local state
            return true;
        } catch (error) {
            console.error("Failed to submit assignment", error);
            return false;
        }
    };

    const submitTestResult = async (studentId, testId, score, totalQuestions, answers) => {
        try {
            await api.post('students/tests/submit', { test_id: testId, score, total_questions: totalQuestions, answers });
            return true;
        } catch (error) {
            console.error("Failed to submit test result", error);
            return false;
        }
    };

    const enrollCourse = async (courseId) => {
        try {
            await api.post('students/enroll', { course_id: courseId });
            fetchData();
            return true;
        } catch (error) {
            console.error("Failed to enroll in course", error);
            throw error;
        }
    };

    const requestCertificate = async (studentId, courseId, videoLink) => {
        try {
            await api.post('students/certificates/request', { course_id: courseId, video_link: videoLink });
            fetchData(); // Refresh to show pending status
            return true;
        } catch (error) {
            console.error("Failed to request certificate", error);
            return false;
        }
    };

    const approveCertificate = async (requestId) => {
        try {
            await api.post(`admin/certificates/approve/${requestId}`);
            fetchData(); // Refresh list
            return true;
        } catch (error) {
            console.error("Failed to approve certificate", error);
            return false;
        }
    };

    const rejectCertificate = async (requestId, reason) => {
        try {
            await api.post(`admin/certificates/reject/${requestId}`, { reason });
            fetchData(); // Refresh list
            return true;
        } catch (error) {
            console.error("Failed to reject certificate", error);
            return false;
        }
    };

    const approveProject = async (projectId) => {
        try {
            await api.post(`projects/approve/${projectId}`);
            fetchData();
            return true;
        } catch (error) {
            console.error("Failed to approve project", error);
            return false;
        }
    };

    // Legacy functions no longer needed but kept empty to prevent crash if called
    const loginUser = () => { };
    const logoutUser = () => { };

    return (
        <DataContext.Provider value={{ data, saveData, loginUser, logoutUser, submitAssignment, submitTestResult, requestCertificate, approveCertificate, rejectCertificate, approveProject, fetchData, enrollCourse }}>
            {children}
        </DataContext.Provider>
    );
};
