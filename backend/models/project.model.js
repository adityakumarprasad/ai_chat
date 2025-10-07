import mongoose from "mongoose";
const projectSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true,
    trim: true,
    minLength: 3,
  } ,

  users : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

});

const Project = mongoose.model("Project", projectSchema);
export default Project;
