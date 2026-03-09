'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Users, TrendingUp, Filter } from 'lucide-react';

interface ReportData {
  totalEvaluations: number;
  averageScore: number;
  facultyPerformance: Array<{ name: string; id: string; average: number; evaluations: number }>;
  subjectPerformance: Array<{ code: string; title: string; average: number; evaluations: number }>;
  semesterData: Array<{ semester: string; total: number; average: number }>;
  recentEvaluations: Array<{ id: string; faculty: string; subject: string; subjectTitle: string; score: number; date: any }>;
}

export default function GenerateReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  useEffect(() => {
    loadReportData();
  }, [selectedSemester, selectedFaculty]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFaculty) params.append('facultyId', selectedFaculty);
      if (selectedSemester) params.append('semester', selectedSemester);

      const url = `/api/admin/reports${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.reportData) {
        setReportData(data.reportData);
      } else {
        console.error('Failed to load report data:', data.error);
        // Set empty data if no evaluations exist
        setReportData({
          totalEvaluations: 0,
          averageScore: 0,
          facultyPerformance: [],
          subjectPerformance: [],
          semesterData: [],
          recentEvaluations: []
        });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      // Set empty data on error
      setReportData({
        totalEvaluations: 0,
        averageScore: 0,
        facultyPerformance: [],
        subjectPerformance: [],
        semesterData: [],
        recentEvaluations: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFaculty) params.append('facultyId', selectedFaculty);
      if (selectedSemester) params.append('semester', selectedSemester);

      const url = `/api/admin/reports/pdf${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or create one
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'evaluation_report.pdf';
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('[Generate Reports] PDF downloaded successfully');
    } catch (error: any) {
      console.error('[Generate Reports] PDF generation error:', error);
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFaculty) params.append('facultyId', selectedFaculty);
      if (selectedSemester) params.append('semester', selectedSemester);

      const url = `/api/admin/reports/excel${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Excel');
      }

      // Create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or create one
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'evaluation_report.xlsx';
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('[Generate Reports] Excel downloaded successfully');
    } catch (error: any) {
      console.error('[Generate Reports] Excel generation error:', error);
      alert('Failed to generate Excel: ' + error.message);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: '#dcfce7', text: '#166534' };
    if (score >= 75) return { bg: '#dbeafe', text: '#1e40af' };
    if (score >= 60) return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading report data...</div>;
  }

  if (!reportData) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No report data available</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>Generate Reports</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleGeneratePDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            <FileText size={16} /> Export PDF
          </button>
          <button
            onClick={handleGenerateExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div style={{
        background: '#fff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedReport('overview')}
            style={{
              padding: '10px 20px',
              background: selectedReport === 'overview' ? 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)' : '#f0f0f0',
              color: selectedReport === 'overview' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedReport('faculty')}
            style={{
              padding: '10px 20px',
              background: selectedReport === 'faculty' ? 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)' : '#f0f0f0',
              color: selectedReport === 'faculty' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Faculty Performance
          </button>
          <button
            onClick={() => setSelectedReport('subject')}
            style={{
              padding: '10px 20px',
              background: selectedReport === 'subject' ? 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)' : '#f0f0f0',
              color: selectedReport === 'subject' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Subject Analysis
          </button>
          <button
            onClick={() => setSelectedReport('semester')}
            style={{
              padding: '10px 20px',
              background: selectedReport === 'semester' ? 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)' : '#f0f0f0',
              color: selectedReport === 'semester' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Semester Comparison
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-end'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: '#666' }} />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Filters:</span>
        </div>
        <div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">All Semesters</option>
            {reportData.semesterData.map(s => (
              <option key={s.semester} value={s.semester}>{s.semester}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">All Faculty</option>
            {reportData.facultyPerformance.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
              padding: '24px',
              borderRadius: '8px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileText size={32} />
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Evaluations</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700 }}>{reportData.totalEvaluations}</div>
            </div>
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrendingUp size={32} style={{ color: '#8b1a2b' }} />
                <span style={{ fontSize: '14px', color: '#666' }}>Average Score</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#333' }}>{reportData.averageScore.toFixed(2)}%</div>
            </div>
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Users size={32} style={{ color: '#8b1a2b' }} />
                <span style={{ fontSize: '14px', color: '#666' }}>Faculty Evaluated</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#333' }}>{reportData.facultyPerformance.length}</div>
            </div>
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Calendar size={32} style={{ color: '#8b1a2b' }} />
                <span style={{ fontSize: '14px', color: '#666' }}>Semesters Covered</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#333' }}>{reportData.semesterData.length}</div>
            </div>
          </div>

          {/* Recent Evaluations Table */}
          {reportData.recentEvaluations.length > 0 && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>Recent Evaluations</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Faculty</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Score</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.recentEvaluations.map((evaluation) => {
                    const displayScore = evaluation.score / 5; // Convert to score out of 20
                    const percentage = (displayScore / 20) * 100;
                    const colors = getScoreColor(percentage);
                    return (
                      <tr key={evaluation.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#333', fontSize: '14px', fontWeight: 500 }}>{evaluation.faculty}</td>
                        <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>
                          <div>{evaluation.subject}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{evaluation.subjectTitle}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#333', fontSize: '14px', fontWeight: 600 }}>
                          {displayScore.toFixed(2)}/20
                        </td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>{formatDate(evaluation.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedReport === 'faculty' && (
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
            Faculty Performance Report
          </h3>
          {reportData.facultyPerformance.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No faculty performance data available. Please submit some evaluations first.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Faculty Name</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Average Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Evaluations</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {reportData.facultyPerformance.map((faculty) => {
                  const colors = getScoreColor(faculty.average);
                  return (
                    <tr key={faculty.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#333', fontSize: '14px', fontWeight: 500 }}>{faculty.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#333', fontSize: '14px', fontWeight: 600 }}>
                        {faculty.average}/100
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>{faculty.evaluations}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: colors.bg,
                          color: colors.text
                        }}>
                          {faculty.average >= 90 ? 'Outstanding' : faculty.average >= 75 ? 'Very Satisfactory' : faculty.average >= 60 ? 'Satisfactory' : 'Fair'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedReport === 'subject' && (
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
            Subject Performance Report
          </h3>
          {reportData.subjectPerformance.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No subject performance data available. Please submit some evaluations first.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Subject Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Subject Title</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Average Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Evaluations</th>
                </tr>
              </thead>
              <tbody>
                {reportData.subjectPerformance.map((subject, idx) => {
                  const colors = getScoreColor(subject.average);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#333', fontSize: '14px', fontWeight: 600 }}>{subject.code}</td>
                      <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>{subject.title}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#333', fontSize: '14px', fontWeight: 600 }}>
                        {subject.average}/100
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>{subject.evaluations}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedReport === 'semester' && (
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
            Semester Comparison Report
          </h3>
          {reportData.semesterData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No semester data available. Please submit some evaluations first.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Semester</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Total Evaluations</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Average Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#333', fontSize: '14px', borderBottom: '2px solid #e0e0e0' }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedSemesters = [...reportData.semesterData].sort((a, b) => b.semester.localeCompare(a.semester));
                  return sortedSemesters.map((sem, idx) => {
                    const trend = idx < sortedSemesters.length - 1 && sortedSemesters[idx + 1]
                      ? (sem.average - sortedSemesters[idx + 1].average).toFixed(2)
                      : 'N/A';
                    const isPositive = parseFloat(trend) > 0;
                    return (
                      <tr key={sem.semester} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#333', fontSize: '14px', fontWeight: 500 }}>{sem.semester}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#333', fontSize: '14px', fontWeight: 600 }}>{sem.total}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#333', fontSize: '14px', fontWeight: 600 }}>{sem.average.toFixed(2)}%</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            color: isPositive ? '#22c55e' : parseFloat(trend) < 0 ? '#ef4444' : '#666',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}>
                            {trend !== 'N/A' && (isPositive ? '+' : '')}{trend}%
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
