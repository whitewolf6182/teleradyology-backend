import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { companyRoutes } from './routes/company.routes';
import { userCompanyRoutes } from './routes/user-company.routes';
import { institutionRoutes } from './routes/institution.routes';
import { deviceRoutes } from './routes/device.routes';

import { InstitutionService } from './services/institution.service';
import { CompanyService } from './services/company.service';

const institutionService = new InstitutionService();
const companyService = new CompanyService();


// console.time("getAllCompanies");

const result = await companyService.getAllCompanies({});

// console.timeEnd("getAllCompanies");

console.log('All Companies:', result);


// for(let i = 0; i < 1000; i++) {

//  try
//  {

//   const result = await institutionService.getAllInstitutions();

//          console.log(result);

//  } catch (error) {
//     console.error('Error during institution creation:', error);
//     break;
//   }

// }

const PORT = Number(process.env.PORT); // Railway otomatik sağlar

console.log(PORT);

const app = new Elysia()
  .use(cors())
  .use(swagger({
    path: '/docs', // Swagger UI'yi buradan erişilebilir yap
    documentation: {
      info: {
        title: 'Company API',
        version: '1.0.0',
        description: 'Company Management API Documentation'
      }
    }
  }))
  .get('/', () => ({
    message: 'Teleradiology Backend API',
    version: '1.0.0',
    status: 'running',
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }))
  .use(authRoutes)
  .use(userRoutes)
  .use(companyRoutes)
  .use(userCompanyRoutes)
  .use(institutionRoutes)
  .use(deviceRoutes)
  .onError(({ code, error, set }) => {
    console.error('Error:', error);

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        message: 'Validation error',
        error: error.message,
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        message: 'Route not found',
      };
    }

    set.status = 500;
    return {
      success: false,
      message: 'Internal server error',
    };
  })
.listen({
    port: PORT,
    hostname: "0.0.0.0",
});


console.log(
  `🚀 Teleradiology Backend is running at http://${app.server?.hostname}:${app.server?.port}`
);

export default app;
