const mongoose = require("mongoose");
const { commonFields, updateTimestamps } = require("../commonFields");
const { type } = require("os");
const { stringify } = require("querystring");

// Define your Mongoose schema based on the interface
const CertificateSchema = new mongoose.Schema({
  title: [
    {
      name: {
        type: String
      },
      fontFamily: {
        type: String
      },
      fontSize: {
        type: Number
      },
      bold: {
        type: String
      },
      italic: {
        type: String
      },
    }
  ],
  verifiableLink: {
    type: Boolean,
  },
  logos: {
    type: Array,
  },
  header: [{
    header: {
      type: String
    },
    fontFamily: {
      type: String
    },
    fontSize: {
      type: Number
    },
    bold: {
      type: String
    },
    italic: {
      type: String
    },
  }],
  body: {
    body: {
      type: String
    },
    fontFamily: {
      type: String
    },
    fontSize: {
      type: Number
    },
    bold: {
      type: String
    },
    italic: {
      type: String
    },
  },
  footer: [{
    footer: {
      type: String
    },
    fontFamily: {
      type: String
    },
    fontSize: {
      type: Number
    },
  }],
  signatures: [
    {
      name: {
        name: {
          type: String
        },
        fontFamily: {
          type: String
        },
        fontSize: {
          type: Number
        },
        bold: {
          type: String
        },
        italic: {
          type: String
        },
        // required: true,
      },
      position: {
        position: {
          type: String
        },
        fontFamily: {
          type: String
        },
        fontSize: {
          type: Number
        },
        bold: {
          type: String
        },
        italic: {
          type: String
        },
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    // You can add more fields if needed
  ],
  certiType: {
    type: String,
  },

  eventId: {
    type: String,
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
