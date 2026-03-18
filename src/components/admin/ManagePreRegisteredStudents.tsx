'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit, Search, Users, User, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';

interface PreRegisteredStudent {
  id: string;
  fullName: string;
  studentId: string;
  registered: boolean;
  userId?: string;
  createdAt: Date;
  registeredAt?: Date;
}

export default function ManagePreRegisteredStudents() {
  const [students, setStudents] = useState<PreRegisteredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<PreRegisteredStudent | null>(null);
  const [formData, setFormData] = useState({ fullName: '', studentId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadStudents();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pre-registered-students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error loading pre-registered students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    setError('');
    if (!formData.fullName.trim() || !formData.studentId.trim()) {
      setError('Full Name and Student ID are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/pre-registered-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add student');
      }

      setSuccess('Student pre-registered successfully!');
      setFormData({ fullName: '', studentId: '' });
      setShowAddModal(false);
      loadStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;
    setError('');

    try {
      const response = await fetch('/api/admin/pre-registered-students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStudent.id,
          ...formData
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      setSuccess('Student updated successfully!');
      setShowEditModal(false);
      setSelectedStudent(null);
      setFormData({ fullName: '', studentId: '' });
      loadStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/admin/pre-registered-students?id=${selectedStudent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      setSuccess('Student removed successfully!');
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
      loadStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (student: PreRegisteredStudent) => {
    setSelectedStudent(student);
    setFormData({ fullName: student.fullName, studentId: student.studentId });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (student: PreRegisteredStudent) => {
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const registeredCount = students.filter(s => s.registered).length;
  const pendingCount = students.filter(s => !s.registered).length;

  return (
    <div style={{ padding: isMobile ? '0' : '0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '16px' : '24px',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px', fontWeight: 700 }}>
          Pre-Registered Students
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: isMobile ? '13px' : '15px' }}>
          Add students first before they can create their accounts
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          background: '#d4edda',
          border: '1px solid #28a745',
          color: '#155724',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #dc3545',
          color: '#721c24',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '16px' : '24px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="#1976d2" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Pre-Registered</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>{students.length}</div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={24} color="#28a745" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Registered</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#28a745' }}>{registeredCount}</div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={24} color="#ff9800" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Pending Registration</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff9800' }}>{pendingCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '14px' : '20px',
        marginBottom: isMobile ? '16px' : '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '16px',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            position: 'relative',
            flex: isMobile ? '1' : '0 1 300px'
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999'
            }} />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={() => {
              setFormData({ fullName: '', studentId: '' });
              setShowAddModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
              color: 'white',
              border: 'none',
              padding: isMobile ? '12px 16px' : '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <UserPlus size={18} />
            Add Pre-Registered Student
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '8px' : '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>No students found</p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm ? 'Try a different search term' : 'Click "Add Pre-Registered Student" to get started'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>Full Name</th>
                  <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>Student ID</th>
                  <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>Status</th>
                  <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#666" />
                        {student.fullName}
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={16} color="#666" />
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.studentId}</span>
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'center' }}>
                      {student.registered ? (
                        <span style={{
                          background: '#d4edda',
                          color: '#155724',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          ✓ Registered
                        </span>
                      ) : (
                        <span style={{
                          background: '#fff3cd',
                          color: '#856404',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(student)}
                          disabled={student.registered}
                          style={{
                            background: student.registered ? '#e0e0e0' : '#e3f2fd',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: student.registered ? 'not-allowed' : 'pointer',
                            opacity: student.registered ? 0.5 : 1
                          }}
                          title={student.registered ? 'Cannot edit registered student' : 'Edit'}
                        >
                          <Edit size={16} color={student.registered ? '#999' : '#1976d2'} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(student)}
                          disabled={student.registered}
                          style={{
                            background: student.registered ? '#e0e0e0' : '#ffebee',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: student.registered ? 'not-allowed' : 'pointer',
                            opacity: student.registered ? 0.5 : 1
                          }}
                          title={student.registered ? 'Cannot delete registered student' : 'Delete'}
                        >
                          <Trash2 size={16} color={student.registered ? '#999' : '#d32f2f'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '450px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#333' }}>
              Add Pre-Registered Student
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              Add the student's full name and student ID. They will use these to create their account.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter student's full name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Student ID *
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                placeholder="Enter student ID (e.g., 2024-00001)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#888' }}>
                Student ID will be automatically converted to uppercase
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleAddStudent}
                style={{
                  background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add Student
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ fullName: '', studentId: '' });
                  setError('');
                }}
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '450px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#333' }}>
              Edit Pre-Registered Student
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Student ID
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleEditStudent}
                style={{
                  background: 'linear-gradient(135deg, #8b1a2b 0%, #6b1520 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedStudent(null);
                  setFormData({ fullName: '', studentId: '' });
                  setError('');
                }}
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ffebee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={32} color="#d32f2f" />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: '#333' }}>
              Remove Pre-Registered Student?
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
              Are you sure you want to remove this student?
            </p>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: 600, color: '#333' }}>
              {selectedStudent.fullName} ({selectedStudent.studentId})
            </p>
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleDeleteStudent}
                style={{
                  background: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Remove
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedStudent(null);
                }}
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
