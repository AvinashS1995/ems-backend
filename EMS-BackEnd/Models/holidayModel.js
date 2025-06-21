import mongoose from 'mongoose';

const holidySchema = new mongoose.Schema({
    name: {
        type: String,
        Required: [true, 'Holiday Name is required field'],
    },
    date: {
        type: Date,
        Required: [true, 'Holiday Date is required field'],
    },
    description: {
        type: String,
        Required: [true, 'Holiday Description is required field'],
    },
    year: {
        type: String,
        Required: [true, 'Holiday Year is required field'],
    },
    month: {
        type: String,
        Required: [true, 'Holiday Month is required field'],
    }
})

const Holidays = mongoose.model("Holidays", holidySchema)

export { Holidays }