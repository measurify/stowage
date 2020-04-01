/**
 * @swagger
 * definitions:
 *      error:
 *          type: object
 *          properties:
 *              status:
 *                  description: HTTP error code
 *                  type: number
 *                  example: 404
 *              message:
 *                  description: error description
 *                  example: "Element not found"
 *                  type: string
 *              details:
 *                  description: more detailed information
 *                  example: "Incorrect username or password"
 *                  type: string
 */