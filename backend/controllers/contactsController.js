import Contact from '../models/Contact.js';
import csvParser from 'csv-parser';
import fs from 'fs';

/**
 * Contacts Controller
 * Handles contact management operations
 */

/**
 * @desc    Get all contacts for user
 * @route   GET /api/contacts
 * @access  Private
 */
export const getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, groupId, search } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    
    if (groupId) {
      query.groupId = groupId;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('groupId', 'name'),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Contacts retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single contact
 * @route   GET /api/contacts/:id
 * @access  Private
 */
export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('groupId', 'name');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: { contact },
      message: 'Contact retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new contact
 * @route   POST /api/contacts
 * @access  Private
 */
export const createContact = async (req, res, next) => {
  try {
    const { name, phone, email, groupId, notes } = req.body;

    // Format phone number (remove special characters)
    const formattedPhone = phone.replace(/[^0-9+]/g, '');

    // Check for duplicate contact
    const existingContact = await Contact.findOne({
      userId: req.user._id,
      phone: formattedPhone
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name,
      phone: formattedPhone,
      email,
      groupId: groupId || null,
      notes
    });

    res.status(201).json({
      success: true,
      data: { contact },
      message: 'Contact created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
export const updateContact = async (req, res, next) => {
  try {
    const { name, phone, email, groupId, notes, isActive } = req.body;

    let contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // If phone is being updated, check for duplicates
    if (phone && phone !== contact.phone) {
      const formattedPhone = phone.replace(/[^0-9+]/g, '');
      
      const duplicate = await Contact.findOne({
        userId: req.user._id,
        phone: formattedPhone,
        _id: { $ne: contact._id }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this phone number already exists'
        });
      }

      contact.phone = formattedPhone;
    }

    // Update other fields
    if (name) contact.name = name;
    if (email !== undefined) contact.email = email;
    if (groupId !== undefined) contact.groupId = groupId;
    if (notes !== undefined) contact.notes = notes;
    if (isActive !== undefined) contact.isActive = isActive;

    await contact.save();

    res.json({
      success: true,
      data: { contact },
      message: 'Contact updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete contacts
 * @route   POST /api/contacts/bulk-delete
 * @access  Private
 */
export const bulkDeleteContacts = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide array of contact IDs'
      });
    }

    const result = await Contact.deleteMany({
      _id: { $in: ids },
      userId: req.user._id
    });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `${result.deletedCount} contacts deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Import contacts from CSV
 * @route   POST /api/contacts/import
 * @access  Private
 */
export const importContacts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    const results = [];
    const errors = [];
    const groupId = req.body.groupId || null;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process contacts
    let successCount = 0;
    let duplicateCount = 0;

    for (const row of results) {
      const name = row.name || row.Name || row.contacts_name || '';
      const phone = (row.phone || row.Phone || row.number || row.Number || '').replace(/[^0-9+]/g, '');

      if (!name || !phone) {
        errors.push({ row, error: 'Missing name or phone' });
        continue;
      }

      // Check for duplicate
      const existing = await Contact.findOne({
        userId: req.user._id,
        phone
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      await Contact.create({
        userId: req.user._id,
        name,
        phone,
        email: row.email || row.Email || null,
        groupId
      });

      successCount++;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        imported: successCount,
        duplicates: duplicateCount,
        errors: errors.length
      },
      message: `Imported ${successCount} contacts. ${duplicateCount} duplicates skipped.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contact count
 * @route   GET /api/contacts/count
 * @access  Private
 */
export const getContactCount = async (req, res, next) => {
  try {
    const count = await Contact.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: { count },
      message: 'Contact count retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};
