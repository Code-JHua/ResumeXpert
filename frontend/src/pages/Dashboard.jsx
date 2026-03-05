import React, { useState }  from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { dashboardStyles as styles } from '../assets/dummystyle'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate();
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [allResumes, setAllResumes] = useState([]);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <div>
            <div className={styles.headerTitle}>My Resume</div> 
            <p className={styles.headerSubtitle}>
              {allResumes.length > 0 ? `You have ${allResumes.length} resume${allResumes.length === 1 ? '' : 's'}` : 'Start building your professional resume'}
            </p>
          </div>

          <div className='flex gap-4'>
            <button className={styles.createButton} onClick={() => setOpenCreateModal(true)}>
              <div className={styles.createButtonOverlay}></div>
              <span className={styles.createButtonContent}>
                Create Now
              </span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard