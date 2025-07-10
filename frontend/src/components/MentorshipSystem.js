import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { apiRequest } from '../App';
import {
  User, Star, Calendar, Clock, MessageSquare, Video, Phone,
  Award, TrendingUp, Users, MapPin, Filter, Search, BookOpen,
  CheckCircle, AlertCircle, ExternalLink, Plus, Edit, Trash2
} from 'lucide-react';

const MentorshipSystem = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('find-mentors');
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpertise, setFilterExpertise] = useState('all');
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  const expertiseAreas = [
    'Technology', 'Marketing', 'Sales', 'Finance', 'Operations',
    'Strategy', 'Product', 'Legal', 'HR', 'International'
  ];

  const mockMentors = [
    {
      id: 'mentor-1',
      user: {
        id: 'user-1',
        fullName: 'Priya Sharma',
        picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b105?w=150',
        country: 'India'
      },
      expertise: ['Technology', 'Product', 'Strategy'],
      experience_years: 15,
      hourly_rate: 2500,
      bio: 'Former CTO at unicorn startup, helped 50+ companies scale their technology infrastructure. Specialized in product development and technical strategy.',
      rating: 4.9,
      total_sessions: 245,
      availability: {
        'Monday': ['10:00', '14:00', '16:00'],
        'Tuesday': ['09:00', '11:00', '15:00'],
        'Wednesday': ['10:00', '13:00', '17:00'],
        'Thursday': ['09:00', '14:00', '16:00'],
        'Friday': ['10:00', '15:00']
      },
      languages: ['English', 'Hindi'],
      company: 'Ex-Flipkart, Ex-Ola',
      achievements: ['Built tech team of 200+', 'Scaled to 10M users', 'Raised $50M Series B']
    },
    {
      id: 'mentor-2',
      user: {
        id: 'user-2',
        fullName: 'Ahmed Al-Rashid',
        picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        country: 'UAE'
      },
      expertise: ['Marketing', 'Sales', 'International'],
      experience_years: 12,
      hourly_rate: 3000,
      bio: 'International business expansion expert. Helped 30+ startups enter Middle East markets. Former VP Marketing at regional unicorn.',
      rating: 4.8,
      total_sessions: 189,
      availability: {
        'Sunday': ['14:00', '16:00', '18:00'],
        'Monday': ['09:00', '11:00', '15:00'],
        'Tuesday': ['10:00', '14:00', '17:00'],
        'Wednesday': ['09:00', '13:00', '16:00'],
        'Thursday': ['11:00', '15:00', '18:00']
      },
      languages: ['English', 'Arabic'],
      company: 'Ex-Careem, Ex-Noon',
      achievements: ['Expanded to 8 countries', 'Generated $100M revenue', 'Led team of 150+']
    },
    {
      id: 'mentor-3',
      user: {
        id: 'user-3',
        fullName: 'Ravi Patel',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        country: 'India'
      },
      expertise: ['Finance', 'Strategy', 'Operations'],
      experience_years: 18,
      hourly_rate: 3500,
      bio: 'Investment banker turned entrepreneur. Raised $200M+ across 15+ deals. Expert in financial modeling, valuations, and fundraising strategy.',
      rating: 5.0,
      total_sessions: 156,
      availability: {
        'Monday': ['15:00', '17:00'],
        'Tuesday': ['16:00', '18:00'],
        'Wednesday': ['15:00', '17:00'],
        'Thursday': ['16:00', '18:00'],
        'Friday': ['15:00', '16:00']
      },
      languages: ['English', 'Hindi', 'Gujarati'],
      company: 'Ex-Goldman Sachs, Ex-Paytm',
      achievements: ['Closed 50+ deals', 'Managed $500M portfolio', 'IPO advisor']
    },
    {
      id: 'mentor-4',
      user: {
        id: 'user-4',
        fullName: 'Sarah Johnson',
        picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        country: 'UAE'
      },
      expertise: ['Legal', 'Operations', 'HR'],
      experience_years: 10,
      hourly_rate: 2800,
      bio: 'Corporate lawyer specializing in startup legal frameworks. Helped 100+ companies with incorporation, compliance, and contract negotiations.',
      rating: 4.7,
      total_sessions: 203,
      availability: {
        'Sunday': ['10:00', '14:00'],
        'Monday': ['09:00', '13:00', '16:00'],
        'Tuesday': ['10:00', '15:00'],
        'Wednesday': ['09:00', '14:00', '17:00'],
        'Thursday': ['11:00', '16:00']
      },
      languages: ['English', 'French'],
      company: 'Ex-DLA Piper, Ex-Mashreq Bank',
      achievements: ['Handled 200+ incorporations', 'Compliance expert', 'Contract specialist']
    }
  ];

  const mockSessions = [
    {
      id: 'session-1',
      mentor_id: 'mentor-1',
      mentor: {
        fullName: 'Priya Sharma',
        picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b105?w=150'
      },
      scheduled_at: '2024-01-15T10:00:00Z',
      duration: 60,
      status: 'completed',
      meeting_link: 'https://meet.google.com/abc-def-ghi',
      notes: 'Discussed product roadmap and technical architecture decisions. Key recommendations around microservices adoption.',
      agenda: 'Product strategy and technical architecture review'
    },
    {
      id: 'session-2',
      mentor_id: 'mentor-2',
      mentor: {
        fullName: 'Ahmed Al-Rashid',
        picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      scheduled_at: '2024-01-20T15:00:00Z',
      duration: 90,
      status: 'scheduled',
      meeting_link: 'https://zoom.us/j/123456789',
      agenda: 'Middle East market expansion strategy and go-to-market planning'
    }
  ];

  useEffect(() => {
    fetchMentors();
    fetchSessions();
    checkAssessmentStatus();
  }, []);

  const fetchMentors = async () => {
    try {
      // In real implementation, this would be an API call
      setMentors(mockMentors);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      // Use mock data for now
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAssessmentStatus = () => {
    // Check if user has completed startup readiness assessment
    const completed = localStorage.getItem(`assessment_completed_${user.id}`);
    setAssessmentCompleted(!!completed);
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExpertise = filterExpertise === 'all' || mentor.expertise.includes(filterExpertise);
    return matchesSearch && matchesExpertise;
  });

  const StartupAssessment = () => {
    const [assessmentData, setAssessmentData] = useState({
      businessStage: '',
      industry: '',
      teamSize: '',
      funding: '',
      challenges: [],
      goals: [],
      timeline: '',
      experience: ''
    });

    const challenges = [
      'Product Development', 'Market Validation', 'Fundraising', 'Team Building',
      'Marketing & Sales', 'Operations', 'Legal & Compliance', 'Technology',
      'Financial Planning', 'International Expansion'
    ];

    const goals = [
      'Launch MVP', 'Acquire First Customers', 'Raise Funding', 'Scale Team',
      'Enter New Markets', 'Improve Product', 'Increase Revenue', 'Build Partnerships',
      'Develop Strategy', 'Exit Planning'
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      localStorage.setItem(`assessment_completed_${user.id}`, 'true');
      localStorage.setItem(`assessment_data_${user.id}`, JSON.stringify(assessmentData));
      setAssessmentCompleted(true);
      setShowAssessmentModal(false);
      alert('Assessment completed! You can now book mentorship sessions.');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Startup Readiness Assessment</h2>
            <p className="text-gray-600">Help us understand your startup to recommend the best mentors</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Stage</label>
                <select
                  value={assessmentData.businessStage}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, businessStage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select stage</option>
                  <option value="idea">Idea Stage</option>
                  <option value="prototype">Prototype/MVP</option>
                  <option value="launched">Launched/Early Traction</option>
                  <option value="scaling">Scaling/Growth</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <input
                  type="text"
                  value={assessmentData.industry}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., FinTech, HealthTech, E-commerce"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                <select
                  value={assessmentData.teamSize}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, teamSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select team size</option>
                  <option value="solo">Solo Founder</option>
                  <option value="2-3">2-3 people</option>
                  <option value="4-10">4-10 people</option>
                  <option value="10+">10+ people</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funding Status</label>
                <select
                  value={assessmentData.funding}
                  onChange={(e) => setAssessmentData(prev => ({ ...prev, funding: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select funding status</option>
                  <option value="bootstrapped">Bootstrapped</option>
                  <option value="seeking">Seeking Investment</option>
                  <option value="pre-seed">Pre-Seed Raised</option>
                  <option value="seed">Seed Raised</option>
                  <option value="series-a">Series A+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Key Challenges (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {challenges.map(challenge => (
                  <label key={challenge} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.challenges.includes(challenge)}
                      onChange={(e) => {
                        const newChallenges = e.target.checked
                          ? [...assessmentData.challenges, challenge]
                          : assessmentData.challenges.filter(c => c !== challenge);
                        setAssessmentData(prev => ({ ...prev, challenges: newChallenges }));
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{challenge}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Goals for Next 6 Months (Select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {goals.map(goal => (
                  <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.goals.includes(goal)}
                      onChange={(e) => {
                        const newGoals = e.target.checked
                          ? [...assessmentData.goals, goal]
                          : assessmentData.goals.filter(g => g !== goal);
                        setAssessmentData(prev => ({ ...prev, goals: newGoals }));
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Previous Startup Experience</label>
              <textarea
                value={assessmentData.experience}
                onChange={(e) => setAssessmentData(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe your previous entrepreneurial experience..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Complete Assessment
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const MentorCard = ({ mentor }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <img
            src={mentor.user.picture}
            alt={mentor.user.fullName}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{mentor.user.fullName}</h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{mentor.rating}</span>
                <span className="text-sm text-gray-500">({mentor.total_sessions})</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{mentor.company}</p>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {mentor.user.country}
              </span>
              <span className="flex items-center">
                <Award className="w-4 h-4 mr-1" />
                {mentor.experience_years}y exp
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {mentor.expertise.slice(0, 3).map(skill => (
              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {mentor.expertise.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{mentor.expertise.length - 3} more
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{mentor.bio}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-600">₹{mentor.hourly_rate}</span>
            <span className="text-sm text-gray-500">/hour</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMentor(mentor)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              View Profile
            </button>
            <button
              onClick={() => {
                setSelectedMentor(mentor);
                setShowBookingModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              disabled={!assessmentCompleted}
            >
              Book Session
            </button>
          </div>
        </div>

        {!assessmentCompleted && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              Complete startup assessment to book sessions
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const BookingModal = () => {
    const [bookingData, setBookingData] = useState({
      date: '',
      time: '',
      duration: '60',
      agenda: '',
      meetingType: 'video'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const scheduledAt = new Date(`${bookingData.date}T${bookingData.time}`);

        const formData = new FormData();
        formData.append('mentor_id', selectedMentor.id);
        formData.append('scheduled_at', scheduledAt.toISOString());
        formData.append('duration', parseInt(bookingData.duration));
        formData.append('agenda', bookingData.agenda);
        formData.append('meeting_type', bookingData.meetingType);

        await apiRequest('post', '/mentorship/book', formData);

        setShowBookingModal(false);
        setSelectedMentor(null);
        setBookingData({
          date: '',
          time: '',
          duration: '60',
          agenda: '',
          meetingType: 'video'
        });

        fetchSessions();
        alert('Session booked successfully! You will receive a confirmation email.');
      } catch (error) {
        console.error('Failed to book session:', error);
        alert('Failed to book session. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    // Get available time slots for selected date
    const getAvailableSlots = () => {
      if (!bookingData.date || !selectedMentor) return [];

      const selectedDate = new Date(bookingData.date);
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      return selectedMentor.availability[dayName] || [];
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Book Session with {selectedMentor?.user.fullName}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select time</option>
                  {getAvailableSlots().map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={bookingData.duration}
                  onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                <select
                  value={bookingData.meetingType}
                  onChange={(e) => setBookingData(prev => ({ ...prev, meetingType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Agenda</label>
              <textarea
                value={bookingData.agenda}
                onChange={(e) => setBookingData(prev => ({ ...prev, agenda: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="What would you like to discuss in this session?"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Session Cost:</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{(selectedMentor?.hourly_rate || 0) * (parseInt(bookingData.duration) / 60)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {bookingData.duration} minutes at ₹{selectedMentor?.hourly_rate}/hour
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Booking...' : 'Book & Pay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const SessionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Mentorship Sessions</h2>
        <div className="flex space-x-3">
          {!assessmentCompleted && (
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Complete Assessment
            </button>
          )}
          <button
            onClick={() => setActiveTab('find-mentors')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Book New Session
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions booked yet</h3>
          <p className="text-gray-500 mb-6">Start by finding a mentor and booking your first session</p>
          <button
            onClick={() => setActiveTab('find-mentors')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Find Mentors
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={session.mentor?.picture || 'https://via.placeholder.com/48'}
                    alt={session.mentor?.fullName || 'Mentor'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.mentor?.fullName || 'Unknown Mentor'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${session.status === 'completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {session.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">{session.duration} min</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Agenda:</h4>
                <p className="text-sm text-gray-600">{session.agenda}</p>
              </div>

              {session.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Session Notes:</h4>
                  <p className="text-sm text-gray-600">{session.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {session.duration} minutes
                  </span>
                  {session.meeting_link && (
                    <span className="flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      Video call
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  {session.status === 'scheduled' && session.meeting_link && (
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </a>
                  )}
                  {session.status === 'scheduled' && (
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Cancel Session
                    </button>
                  )}
                  {session.status === 'completed' && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MentorProfileTab = () => {
    const [mentorProfile, setMentorProfile] = useState({
      expertise: [],
      experience_years: '',
      hourly_rate: '',
      bio: '',
      languages: [],
      achievements: [],
      availability: {
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': [],
        'Sunday': []
      }
    });
    const [isEditing, setIsEditing] = useState(false);

    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    const availableLanguages = [
      'English', 'Hindi', 'Arabic', 'French', 'Spanish', 'German',
      'Mandarin', 'Japanese', 'Korean', 'Portuguese', 'Russian'
    ];

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        Object.keys(mentorProfile).forEach(key => {
          if (Array.isArray(mentorProfile[key])) {
            formData.append(key, JSON.stringify(mentorProfile[key]));
          } else if (typeof mentorProfile[key] === 'object') {
            formData.append(key, JSON.stringify(mentorProfile[key]));
          } else {
            formData.append(key, mentorProfile[key]);
          }
        });

        await apiRequest('post', '/mentors/profile', formData);
        setIsEditing(false);
        alert('Mentor profile updated successfully!');
      } catch (error) {
        console.error('Failed to update mentor profile:', error);
        alert('Failed to update profile. Please try again.');
      }
    };

    const toggleAvailability = (day, timeSlot) => {
      setMentorProfile(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: prev.availability[day].includes(timeSlot)
            ? prev.availability[day].filter(slot => slot !== timeSlot)
            : [...prev.availability[day], timeSlot].sort()
        }
      }));
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Mentor Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium ${isEditing
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={mentorProfile.experience_years}
                  onChange={(e) => setMentorProfile(prev => ({ ...prev, experience_years: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!isEditing}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  value={mentorProfile.hourly_rate}
                  onChange={(e) => setMentorProfile(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!isEditing}
                  min="500"
                  step="100"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={mentorProfile.bio}
                onChange={(e) => setMentorProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                disabled={!isEditing}
                placeholder="Tell mentees about your background, experience, and how you can help them..."
              />
            </div>
          </div>

          {/* Expertise Areas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Expertise Areas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {expertiseAreas.map(area => (
                <label key={area} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mentorProfile.expertise.includes(area)}
                    onChange={(e) => {
                      if (!isEditing) return;
                      const newExpertise = e.target.checked
                        ? [...mentorProfile.expertise, area]
                        : mentorProfile.expertise.filter(exp => exp !== area);
                      setMentorProfile(prev => ({ ...prev, expertise: newExpertise }));
                    }}
                    className="text-blue-600"
                    disabled={!isEditing}
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Languages</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableLanguages.map(language => (
                <label key={language} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mentorProfile.languages.includes(language)}
                    onChange={(e) => {
                      if (!isEditing) return;
                      const newLanguages = e.target.checked
                        ? [...mentorProfile.languages, language]
                        : mentorProfile.languages.filter(lang => lang !== language);
                      setMentorProfile(prev => ({ ...prev, languages: newLanguages }));
                    }}
                    className="text-blue-600"
                    disabled={!isEditing}
                  />
                  <span className="text-sm">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Availability</h3>
            <div className="space-y-4">
              {Object.keys(mentorProfile.availability).map(day => (
                <div key={day}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{day}</h4>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map(timeSlot => (
                      <button
                        key={timeSlot}
                        type="button"
                        onClick={() => isEditing && toggleAvailability(day, timeSlot)}
                        disabled={!isEditing}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${mentorProfile.availability[day].includes(timeSlot)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${!isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        {timeSlot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Key Achievements</h3>
            {mentorProfile.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 mb-3">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const newAchievements = [...mentorProfile.achievements];
                    newAchievements[index] = e.target.value;
                    setMentorProfile(prev => ({ ...prev, achievements: newAchievements }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!isEditing}
                  placeholder="e.g., Built tech team of 200+ people"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const newAchievements = mentorProfile.achievements.filter((_, i) => i !== index);
                      setMentorProfile(prev => ({ ...prev, achievements: newAchievements }));
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setMentorProfile(prev => ({
                    ...prev,
                    achievements: [...prev.achievements, '']
                  }));
                }}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Achievement
              </button>
            )}
          </div>

          {isEditing && (
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          )}
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Expert Mentorship</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connect with experienced mentors who can guide you through your entrepreneurial journey.
          Get personalized advice from industry experts across technology, business, and more.
        </p>
      </div>

      {/* Assessment Status */}
      {!assessmentCompleted && activeTab === 'find-mentors' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Complete Your Startup Assessment
                </h3>
                <p className="text-gray-600">
                  Help us understand your needs to recommend the best mentors for your journey
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-medium"
            >
              Start Assessment
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('find-mentors')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'find-mentors'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Find Mentors
        </button>
        <button
          onClick={() => setActiveTab('my-sessions')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'my-sessions'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          My Sessions ({sessions.length})
        </button>
        {user.role === 'mentor' && (
          <button
            onClick={() => setActiveTab('mentor-profile')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'mentor-profile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Mentor Profile
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'find-mentors' && (
        <div className="space-y-8">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search mentors by name, expertise, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterExpertise}
                  onChange={(e) => setFilterExpertise(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Expertise Areas</option>
                  {expertiseAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expertise Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterExpertise('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterExpertise === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Mentors
            </button>
            {expertiseAreas.map(area => (
              <button
                key={area}
                onClick={() => setFilterExpertise(area)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterExpertise === area
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-sessions' && <SessionsTab />}

      {activeTab === 'mentor-profile' && user.role === 'mentor' && <MentorProfileTab />}

      {/* Modals */}
      {showAssessmentModal && <StartupAssessment />}
      {showBookingModal && <BookingModal />}

      {/* Mentor Profile Modal */}
      {selectedMentor && !showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedMentor.user.fullName}</h2>
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-start space-x-6">
                    <img
                      src={selectedMentor.user.picture}
                      alt={selectedMentor.user.fullName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedMentor.user.fullName}
                      </h3>
                      <p className="text-gray-600 mb-2">{selectedMentor.company}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedMentor.user.country}
                        </span>
                        <span className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          {selectedMentor.experience_years} years experience
                        </span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{selectedMentor.rating} ({selectedMentor.total_sessions} sessions)</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMentor.expertise.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">About</h4>
                    <p className="text-gray-600">{selectedMentor.bio}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Key Achievements</h4>
                    <ul className="space-y-2">
                      {selectedMentor.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Languages</h4>
                    <div className="flex space-x-2">
                      {selectedMentor.languages.map(language => (
                        <span key={language} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-green-600 mb-2">₹{selectedMentor.hourly_rate}</p>
                    <p className="text-gray-500">per hour</p>
                  </div>

                  <button
                    onClick={() => setShowBookingModal(true)}
                    disabled={!assessmentCompleted}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assessmentCompleted ? 'Book Session' : 'Complete Assessment First'}
                  </button>

                  <div className="space-y-3 text-sm">
                    <h5 className="font-semibold text-gray-700">Availability</h5>
                    {Object.entries(selectedMentor.availability).map(([day, times]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-600">{day}:</span>
                        <span className="text-gray-500">{times.join(', ')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>Instant booking confirmation</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>Video/phone/in-person options</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span>Follow-up resources included</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipSystem;