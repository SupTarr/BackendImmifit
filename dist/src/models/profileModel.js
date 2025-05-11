import mongoose, { Schema } from "mongoose";
export var Gender;
(function (Gender) {
    Gender[Gender["Man"] = 1000] = "Man";
    Gender[Gender["Woman"] = 2000] = "Woman";
})(Gender || (Gender = {}));
const profileSchema = new Schema({
    profileId: {
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
        ref: "User",
    },
    about: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    gender: {
        type: Number,
        required: true,
        enum: Object.values(Gender).filter((v) => typeof v === "number"),
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 150,
    },
    height: {
        type: Number,
        required: true,
        min: 0,
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
    },
    bmi: {
        type: Number,
        min: 0,
    },
}, {
    timestamps: true,
});
const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
