import { Router } from 'express';
import { FileUploadController } from './controller';




export class FileUploadRoutes {


    static get routes(): Router {

        const router = Router();
        const controller = new FileUploadController();
        
        // api/upload/single/<user|categories|products/>
        // api/upload/multiple/<user|categories|products/>
        router.post('/single/:type', controller.uploadFile );
        router.post('/multiple/:type', controller.uploadMultipleFiles );

        return router;
    }


}
