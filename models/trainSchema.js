const Joi = require('joi');

// Define a Joi schema for the train data
const trainSchema = Joi.object({
    trainName: Joi.string().required(),
    trainNumber: Joi.string().required(),
    departureTime: Joi.string().isoDate().required(),
    seatsAvailable: Joi.object({
        sleeper: Joi.number().integer().min(0).required(),
        AC: Joi.number().integer().min(0).required(),
    }).required(),
    price: Joi.object({
        sleeper: Joi.number().min(0).required(),
        AC: Joi.number().min(0).required(),
    }).required(),
    delayedBy: Joi.number().integer().min(0).required(),
});

module.exports = trainSchema;