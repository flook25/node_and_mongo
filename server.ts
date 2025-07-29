// server.ts
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { PrismaClient,Prisma } from './generated/prisma'; // CORRECT IMPORT PATH


dotenv.config();


const prisma = new PrismaClient();
const port = process.env.PORT || 3000;


console.log("Connecting with URL:", process.env.DATABASE_URL);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/check-db-connection', async (req: Request, res: Response) => {
    try {
        await prisma.$connect();
        res.send({ message: "Connected to database" });
    } catch (error: any) { // Type 'error' for now to resolve the TS issue
        console.error("Database connection error:", error); // Good to log the actual error
        res.status(500).send({ error: "Cannot connect to database" });
    }
});

app.post('/customer/create', async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const customer = await prisma.customer.create({
            data: payload,
        });
        res.json(customer);
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known Prisma errors (e.g., unique constraint violation)
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'A customer with this email already exists.' });
            }
        } else if (error instanceof Prisma.PrismaClientValidationError) {
            // Handle validation errors
            return res.status(400).json({ error: 'Invalid data provided.' });
        }
        // Generic error for other cases
        console.error("Error creating customer:", error);
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

app.get('/customer/list', async (req, res) => {
    try {
        const customers = await prisma.customer.findMany();
        res.json(customers);
    } catch (error: any) {
        return res.status(500).json({ error: error.message});
    }

});

// server.ts

// ... (other parts of your express app)

app.get('/customer/detail/:id', async (req, res) => {
    try {
        const { id } = req.params; // Destructure id from request parameters

        const customer = await prisma.customer.findUnique({
            where: {
                id: id // Correct syntax: { fieldName: value }
            }
        });

        // It's good practice to handle the case where the customer is not found
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);

    } catch (error: any) {
        // This will catch other errors, like a malformed ID causing a Prisma error
        console.error("Error fetching customer:", error); // Log the actual error for debugging
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

app.put('/customer/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const payload = req.body;
        const customer = await prisma.customer.update({
            where: {
                id: id
            },
            data : payload
        }); 
        res.json(customer)
    } catch(error : any) {
        res.status(500).json({error : error.message})
    }


});

app.delete('/customer/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await prisma.customer.delete({
            where: {
                id: id
            }
        });
        res.json({ message : "Customer deleted successfully"});
    } catch(error : any) {
        res.status(500).json({ error : error.message})
    }
});

app.get('/customer/startWith/:name', async (req, res) => {
    try {
        // Correctly get the parameter named 'name' from the URL
        const { name } = req.params;

        const customers = await prisma.customer.findMany({
            where: {
                name: {
                    // 'startsWith' is correct for the filter
                    startsWith: name,
                    // Enhancement: make the search case-insensitive
                    mode: 'insensitive',
                }
            }
        });

        // For a findMany, returning an empty array is standard if no results are found.
        // So, no special "not found" check is needed here.
        res.json(customers);

    } catch (error: any) {
        console.error("Error searching customers:", error); // Good to log the error
        return res.status(500).json({ error: error.message });
    }
});

// server.ts

// ... (other parts of your express app)

app.get('/customer/EndsWith/:name', async (req, res) => {
    try {
        // 1. Get the URL parameter, which we've named 'suffix'.
        const { name } = req.params;

        // 2. Use prisma.findMany to search for multiple customers.
        const customers = await prisma.customer.findMany({
            where: {
                // We want to filter based on the 'email' field.
                name: {
                    // 3. Use the 'endsWith' filter.
                    endsWith: name,
                    // 4. (Recommended) Make the search case-insensitive.
                    // This ensures 'GMAIL.COM' and 'gmail.com' are treated the same.
                    mode: 'insensitive',
                }
            }
           
        });

        // findMany returns an empty array ([]) if no customers are found,
        // which is the correct response for a list endpoint.
        res.json(customers);

    } catch (error: any) {
        console.error("Error searching customers", error);
        return res.status(500).json({ error: "An error occurred while searching for customers." });
    }
});

// server.ts

// ... (other parts of your express app)

// The URL is changed to be more descriptive of its function.
app.get('/customer/contains/:keyword', async (req, res) => {
    try {
        // 1. Get the keyword from the URL.
        const { keyword } = req.params;

        // 2. Use prisma.findMany to search for multiple customers.
        const customers = await prisma.customer.findMany({
            where: {
                // We want to filter based on the 'name' field.
                name: {
                    // 3. Use the 'contains' filter. This is the key change.
                    contains: keyword,
                    // 4. (Recommended) Keep the search case-insensitive.
                    // This ensures 'john' finds 'John'.
                    mode: 'insensitive',
                }
            },
            orderBy: {
                name: 'asc' // Order results alphabetically by name.
            }
        });

        // findMany returns an empty array ([]) if no customers are found,
        // which is the correct response.
        res.json(customers);

    } catch (error: any) {
        console.error("Error searching customers by keyword:", error);
        return res.status(500).json({ error: "An error occurred while searching for customers." });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});