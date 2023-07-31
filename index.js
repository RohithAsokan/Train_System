const express = require('express');
const axios = require('axios');
const { DateTime } = require('luxon');
const dburi = "mongodb+srv://rohithasokan2000:FJoqkcUqwsdbOYkT@cluster0.cf4wtnp.mongodb.net/"
const trainSchema = require('C:\\Users\\Rohit Asokan\\train_system\\models\\trainSchema.js');
const registrationSchema = require('C:\\Users\\Rohit Asokan\\train_system\\models\\registrationSchema');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

mongoose.connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true }).then(function(result) {
    app.listen(3000, function(req, res) {
        console.log("server listening @ port 3000");
        console.log("connected to db");
    })
}).catch((err) => {
    console.log(err);
});

const CLIENT_ID = 'b46118f0-fbde-4b16-a4b1-6ae6ad718b27';
const CLIENT_SECRET = 'XOyo10RPasKHODAN';

async function getAccessToken() {
    try {
        const response = await axios.post(AUTH_URL, {
            companyName: 'Train Central',
            clientID: CLIENT_ID,
            ownerName: 'Rohith',
            ownerEmail: '20euec124@skcet.ac.in',
            rollNo: '20euec124',
            clientSecret: CLIENT_SECRET,
        });
        console.log(response.data.access_token)
        return response.data.access_token;
    } catch (error) {
        throw new Error('Failed to get access token.');
    }
}

async function fetchTrainData() {
    console.log("hello")
    const accessToken = await getAccessToken();
    try {
        const response = await axios.get(TRAIN_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        console.log(response.data)
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch train data.');
    }
}

app.get('/trains/trainNumber', async(req, res) => {
    try {
        const accessToken = await getAccessToken();
        const trainNumber = req.params.trainNumber;

        const response = await axios.get(`${TRAIN_URL}/${trainNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const trainDetails = response.data;

        const { error, value } = trainSchema.validate(trainDetails);
        if (error) {
            return res.status(500).json({ error: 'Invalid train data received from the server.' });
        }

        res.json(trainDetails);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching train details.' });
    }
});


app.post('/register', async(req, res) => {
    try {
        console.log("hello world");
        const { error, value } = registrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: 'Invalid registration request.' });
        }

        if (companyCredentials) {
            return res.status(409).json({ error: 'Company is already registered.' });
        }
        const response = await axios.post(REGISTER_URL, value);
        if (response.status === 200) {
            companyCredentials = {
                companyName: value.companyName,
                clientID: response.data.clientID,
                clientSecret: response.data.clientSecret,
            };
            return res.status(200).json({ message: 'Registration successful.', credentials: companyCredentials });
        } else {
            return res.status(response.status).json({ error: 'Failed to register the company.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});


app.get('/trains', async(req, res) => {
    try {
        const trainData = await fetchTrainData();
        const currentTime = DateTime.now();
        const next12Hours = currentTime.plus({ hours: 12 });

        const processedTrains = trainData.reduce((acc, train) => {
            const departureTime = currentTime.set({
                hour: train.departureTime.Hours,
                minute: train.departureTime.Minutes,
                second: train.departureTime.Seconds,
            });
            if (departureTime <= currentTime.plus({ minutes: 30 })) {
                return acc;
            }
            if (departureTime <= next12Hours) {
                acc.push({
                    trainName: train.trainName,
                    trainNumber: train.trainNumber,
                    departureTime: departureTime.toISO(),
                    seatsAvailable: {
                        sleeper: train.seatsAvailable.sleeper,
                        AC: train.seatsAvailable.AC,
                    },
                    price: {
                        sleeper: train.price.sleeper,
                        AC: train.price.AC,
                    },
                    delayedBy: train.delayedBy,
                });
            }

            return acc;
        }, []);

        await TrainModel.insertMany(processedTrains);


    } catch (error) {
        res.status(500).json({ error: error });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port ${PORT}`);
});