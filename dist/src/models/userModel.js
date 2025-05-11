import mongoose, { Schema } from "mongoose";
export var Role;
(function (Role) {
    Role[Role["User"] = 1000] = "User";
    Role[Role["Admin"] = 2000] = "Admin";
})(Role || (Role = {}));
const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    roles: {
        type: [Number],
        default: [Role.User],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/.+\@.+\..+/, "Please fill a valid email address"],
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    refreshToken: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
const User = mongoose.model("User", userSchema);
export default User;
