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
 *          type: string
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

export interface OrganizationItem {
  id: string;
  company: string;
  name: string;
  parent: string;
  createdAt: string;
  updatedAt: string;
}
