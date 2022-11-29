/**
 * @swagger
 * components:
 *  schemas:
 *    Organization:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *        company:
 *          $ref: '#/components/schemas/Company'
 *        name:
 *          type: string
 *        parent:
 *          type: string
 *        createdAt:
 *          type: string
 *          format: date-time
 *        updatedAt:
 *          type: string
 *          format: date-time
 */
import { Company } from './company';

export interface Organization {
  id: string;
  company?: Company;
  name: string;
  parent?: string;
  createdAt: string;
  updatedAt?: string;
}
