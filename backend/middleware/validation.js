import Joi from 'joi';
import AppError from '../utils/appError.js';

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }
    
    next();
  };
};

// Special validation for multipart/form-data (file uploads)
const validateMultipart = (schema) => {
  return (req, res, next) => {
    // Trim all string values
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });

    // Convert string dates to Date objects for validation
    if (req.body.issueDate) {
      req.body.issueDate = new Date(req.body.issueDate);
    }
    if (req.body.expiryDate) {
      req.body.expiryDate = new Date(req.body.expiryDate);
    }
    if (req.body.nsqfLevel) {
      req.body.nsqfLevel = parseInt(req.body.nsqfLevel);
    }

    // Log the data being validated (for debugging)
    console.log('Validating credential data:', {
      learnerId: req.body.learnerId,
      title: req.body.title,
      type: req.body.type,
      category: req.body.category,
      issueDate: req.body.issueDate,
      credentialNumber: req.body.credentialNumber
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      console.error('Validation errors:', error.details);
      const errors = error.details.map(detail => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('learner', 'institution', 'employer').required(),
    firstName: Joi.string().when('role', { is: 'learner', then: Joi.required() }),
    lastName: Joi.string().when('role', { is: 'learner', then: Joi.required() }),
    companyName: Joi.string().when('role', { is: 'employer', then: Joi.required() }),
    industry: Joi.string().when('role', { is: 'employer', then: Joi.required() }),
    institutionName: Joi.string().when('role', { is: 'institution', then: Joi.required() }),
    institutionType: Joi.string().when('role', { 
      is: 'institution', 
      then: Joi.valid('university', 'college', 'training-center', 'online-platform', 'government', 'other').required() 
    }),
    registrationNumber: Joi.string().when('role', { is: 'institution', then: Joi.required() })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createCredential: Joi.object({
    learnerId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().lowercase().valid('certificate', 'diploma', 'badge', 'micro-credential', 'degree', 'other').required(),
    category: Joi.string().lowercase().valid('technical', 'soft-skills', 'management', 'healthcare', 'education', 'finance', 'other').optional(),
    issueDate: Joi.date().required(),
    expiryDate: Joi.date().min(Joi.ref('issueDate')).optional(),
    credentialNumber: Joi.string().required(),
    nsqfLevel: Joi.number().min(1).max(10).optional()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string(),
    bio: Joi.string().max(500),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string()
    })
  })
};

export { validate, validateMultipart, schemas };
