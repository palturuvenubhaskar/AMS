import { useAuth } from '../../contexts/AuthContext';
import Timetable from '../faculty/Timetable';

export default function StudentTimetable() {
  const { user } = useAuth();
  // For students, show their own class timetable
  return <Timetable readOnly={true} classId={user?.studentInfo?.class_id} />;
}
