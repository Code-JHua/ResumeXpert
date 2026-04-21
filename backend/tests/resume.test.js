import request from 'supertest';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Import routes
  import('../routes/userRoutes.js').then(module => {
    app.use('/api/auth', module.default);
  });

  import('../routes/resumeRouter.js').then(module => {
    app.use('/api/resume', module.default);
  });

  return app;
};

describe('Resume API Tests', () => {
  let app;
  let authToken;
  let userId;

  beforeAll(async () => {
    app = createTestApp();
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Create a test user and get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Resume Test User',
        email: `resumetest${Date.now()}@example.com`,
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body._id;
  });

  describe('POST /api/resume', () => {
    it('should create a new resume', async () => {
      const resumeData = {
        title: 'Software Developer Resume'
      };

      const response = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resumeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(resumeData.title);
      expect(response.body.userId).toBe(userId);
      expect(response.body).toHaveProperty('profileInfo');
      expect(response.body).toHaveProperty('contactInfo');
      expect(response.body).toHaveProperty('workExperience');
      expect(response.body).toHaveProperty('education');
      expect(response.body).toHaveProperty('skills');
      expect(response.body.contentSource).toBe('structured');
      expect(response.body.status).toBe('active');
      expect(Array.isArray(response.body.freeBlocks)).toBe(true);
    });

    it('should not create resume without authentication', async () => {
      const response = await request(app)
        .post('/api/resume')
        .send({ title: 'Test Resume' });

      expect(response.status).toBe(401);
    });

    it('should create resume with default data structure', async () => {
      const response = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'My Resume' });

      expect(response.body.profileInfo).toBeDefined();
      expect(response.body.contactInfo).toBeDefined();
      expect(Array.isArray(response.body.workExperience)).toBe(true);
      expect(Array.isArray(response.body.education)).toBe(true);
      expect(Array.isArray(response.body.skills)).toBe(true);
    });
  });

  describe('GET /api/resume', () => {
    it('should get all user resumes', async () => {
      // Create multiple resumes
      await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Resume 1' });

      await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Resume 2' });

      const response = await request(app)
        .get('/api/resume')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return empty array if no resumes exist', async () => {
      const response = await request(app)
        .get('/api/resume')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should not get resumes without authentication', async () => {
      const response = await request(app)
        .get('/api/resume');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/resume/:id', () => {
    it('should get a specific resume by id', async () => {
      // Create a resume
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Specific Resume' });

      const resumeId = createResponse.body._id;

      const response = await request(app)
        .get(`/api/resume/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(resumeId);
      expect(response.body.title).toBe('Specific Resume');
    });

    it('should return 404 for non-existent resume', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/resume/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not get resume without authentication', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const response = await request(app)
        .get(`/api/resume/${createResponse.body._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/resume/:id', () => {
    it('should update resume information', async () => {
      // Create a resume
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Original Title' });

      const resumeId = createResponse.body._id;

      // Update the resume
      const updateData = {
        title: 'Updated Title',
        profileInfo: {
          fullName: 'John Doe',
          designation: 'Software Engineer',
          summary: 'Experienced developer'
        },
        contactInfo: {
          email: 'john@example.com',
          phone: '1234567890'
        }
      };

      const response = await request(app)
        .put(`/api/resume/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.profileInfo.fullName).toBe('John Doe');
      expect(response.body.contactInfo.email).toBe('john@example.com');
    });

    it('should update platformized resume fields', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Platform Resume' });

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentSource: 'imported',
          status: 'draft',
          freeBlocks: [{ type: 'notes', content: 'Needs review' }],
        });

      expect(response.status).toBe(200);
      expect(response.body.contentSource).toBe('imported');
      expect(response.body.status).toBe('draft');
      expect(response.body.freeBlocks).toHaveLength(1);
    });

    it('should update template information', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          template: {
            theme: 'modern',
            colorPalette: ['#ffffff', '#000000']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.template.theme).toBe('modern');
      expect(response.body.template.colorPalette).toEqual(['#ffffff', '#000000']);
    });

    it('should update arrays (skills, work experience, etc.)', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const updateData = {
        skills: [
          { name: 'JavaScript', progress: 90 },
          { name: 'Python', progress: 80 }
        ],
        workExperience: [
          {
            company: 'Tech Company',
            role: 'Developer',
            startDate: '2020-01',
            endDate: '2022-01',
            description: 'Built applications'
          }
        ]
      };

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.skills.length).toBe(2);
      expect(response.body.skills[0].name).toBe('JavaScript');
      expect(response.body.workExperience[0].company).toBe('Tech Company');
    });

    it('should not update resume without authentication', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/resume/:id', () => {
    it('should delete a resume', async () => {
      // Create a resume
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'To Delete' });

      const resumeId = createResponse.body._id;

      // Delete the resume
      const response = await request(app)
        .delete(`/api/resume/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify resume is deleted
      const getResponse = await request(app)
        .get(`/api/resume/${resumeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete resume without authentication', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const response = await request(app)
        .delete(`/api/resume/${createResponse.body._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 when deleting non-existent resume', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/resume/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Resume Data Validation', () => {
    it('should handle empty profileInfo update', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ profileInfo: {} });

      expect(response.status).toBe(200);
    });

    it('should handle complex nested updates', async () => {
      const createResponse = await request(app)
        .post('/api/resume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Resume' });

      const complexData = {
        title: 'Complex Resume',
        profileInfo: {
          fullName: 'Jane Doe',
          designation: 'Full Stack Developer',
          summary: 'Passionate developer'
        },
        contactInfo: {
          email: 'jane@example.com',
          phone: '9876543210',
          location: 'San Francisco',
          linkedin: 'https://linkedin.com/in/jane',
          github: 'https://github.com/jane',
          website: 'https://jane.dev'
        },
        skills: [
          { name: 'React', progress: 95 },
          { name: 'Node.js', progress: 85 },
          { name: 'Python', progress: 75 }
        ],
        projects: [
          {
            title: 'Project A',
            description: 'A web application',
            github: 'https://github.com/jane/project-a',
            liveDemo: 'https://project-a.com'
          }
        ],
        certifications: [
          { title: 'AWS Certified', issuer: 'Amazon', year: '2023' }
        ],
        languages: [
          { name: 'English', progress: 100 },
          { name: 'Spanish', progress: 60 }
        ],
        interests: ['Coding', 'Reading', 'Hiking']
      };

      const response = await request(app)
        .put(`/api/resume/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(complexData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Complex Resume');
      expect(response.body.skills.length).toBe(3);
      expect(response.body.projects.length).toBe(1);
      expect(response.body.certifications.length).toBe(1);
      expect(response.body.languages.length).toBe(2);
      expect(response.body.interests.length).toBe(3);
    });
  });
});
