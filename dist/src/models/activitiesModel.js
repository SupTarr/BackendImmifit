import mongoose, { Schema } from "mongoose";
const activitiesSchema = new Schema({
    activityId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["Running", "Cycling", "Swimming", "Weight training", "Walking"],
    },
    title: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    description: String,
    img: {
        name: {
            type: String,
            required: true,
        },
        id: String,
        url: String,
        contentType: String,
    },
}, {
    timestamps: true,
});
const Activities = mongoose.model("Activities", activitiesSchema);
export default Activities;
