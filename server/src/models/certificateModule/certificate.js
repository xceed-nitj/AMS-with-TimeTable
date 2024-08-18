const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require("../commonFields");
const { type } = require("os");
const { stringify } = require("querystring");

// Define your Mongoose schema based on the interface
const CertificateSchema = new mongoose.Schema({
  title: [
    {
      name: {
        type: String,
        default: " ",
      },
      fontFamily: {
        type: String,
        default: "serif"
      },
      fontSize: {
        type: Number,
        default: 16,
      },
      bold: {
        type: String,
        default: "normal"
      },
      italic: {
        type: String,
        default: "normal"
      },
      fontColor: {
        type: String,
        default: "black"
      }
    }
  ],
  verifiableLink: {
    type: Boolean,
    default: false,
  },
  logos: [{
    url: {
      type: String,
      default: "",
    },
    height: {
      type: Number,
      default: 80,
    },
    width: {
      type: Number,
      default: 80,
    }
  }],
  header: [{
    header: {
      type: String,
      default: " ",
    },
    fontFamily: {
      type: String,
      default: "serif"
    },
    fontSize: {
      type: Number,
      default: 16,
    },
    bold: {
      type: String,
      default: "normal"
    },
    italic: {
      type: String,
      default: "normal"
    },
    fontColor: {
      type: String,
      default: "black"
    }
  }],
  certificateOf: {
    certificateOf: {
      type: String,
      default: "CERTIFICATE OF APPRECIATION"
    },
    fontFamily: {
      type: String,
      default: "serif",
    },
    fontSize: {
      type: Number,
      default: 16,
    },
    bold: {
      type: String,
      default: "normal"
    },
    italic: {
      type: String,
      default: "normal"
    },
    fontColor: {
      type: String,
      default: "black"
    }
  },
  body: {
    body: {
      type: String,
      default: " ",
    },
    fontFamily: {
      type: String,
      default: "serif"
    },
    fontSize: {
      type: Number,
      default: 16,
    },
    bold: {
      type: String,
      default: "normal"
    },
    italic: {
      type: String,
      default: "normal"
    },
    fontColor: {
      type: String,
      default: "black"
    }
  },
  footer: {
    footer: {
      type: String,
      default: " ",
    },
  },
  signatures: [
    {
      name: {
        name: {
          type: String,
          default: " ",
        },
        fontFamily: {
          type: String,
          default: "serif"
        },
        fontSize: {
          type: Number,
          default: 16,
        },
        bold: {
          type: String,
          default: "normal"
        },
        italic: {
          type: String,
          default: "normal"
        },
        fontColor: {
          type: String,
          default: "black"
        }
        // required: true,
      },
      position: {
        position: {
          type: String,
          default: " ",
        },
        fontFamily: {
          type: String,
          default: "serif"
        },
        fontSize: {
          type: Number,
          default: 16,
        },
        bold: {
          type: String,
          default: "normal"
        },
        italic: {
          type: String,
          default: "normal"
        },
        fontColor: {
          type: String,
          default: "black"
        }
        // required: true,
      },
      url: {
        url: {
          type: String,
          default: "",
        },
        size:{
          type: Number,
          default:100,

        }
        // required: true,
      },
    },
    // You can add more fields if needed
  ],
  certiType: {
    type: String,
    required: true,
  },

  eventId: {
    type: String,
    required: true,
  },
  templateId: {
    type: String,
    default: "0",
  },
});

CertificateSchema.add(commonFields);

// Apply the pre-save middleware
CertificateSchema.pre("save", updateTimestamps);

// Create the Mongoose model
const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = Certificate;
