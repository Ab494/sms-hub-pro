import Group from '../models/Group.js';
import Contact from '../models/Contact.js';

/**
 * Groups Controller
 * Handles contact group management
 */

/**
 * @desc    Get all groups for user
 * @route   GET /api/groups
 * @access  Private
 */
export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    // Get contact counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const count = await Contact.countDocuments({
          userId: req.user._id,
          groupId: group._id
        });
        return {
          ...group.toObject(),
          contactCount: count
        };
      })
    );

    res.json({
      success: true,
      data: { groups: groupsWithCounts },
      message: 'Groups retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single group
 * @route   GET /api/groups/:id
 * @access  Private
 */
export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get contact count
    const contactCount = await Contact.countDocuments({
      userId: req.user._id,
      groupId: group._id
    });

    res.json({
      success: true,
      data: { group: { ...group.toObject(), contactCount } },
      message: 'Group retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Private
 */
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    // Check for duplicate group name
    const existingGroup = await Group.findOne({
      userId: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group with this name already exists'
      });
    }

    const group = await Group.create({
      userId: req.user._id,
      name,
      description,
      color
    });

    res.status(201).json({
      success: true,
      data: { group: { ...group.toObject(), contactCount: 0 } },
      message: 'Group created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private
 */
export const updateGroup = async (req, res, next) => {
  try {
    const { name, description, color, isActive } = req.body;

    let group = await Group.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check for duplicate name
    if (name && name !== group.name) {
      const existing = await Group.findOne({
        userId: req.user._id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: group._id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Group with this name already exists'
        });
      }

      group.name = name;
    }

    if (description !== undefined) group.description = description;
    if (color) group.color = color;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();

    const contactCount = await Contact.countDocuments({
      userId: req.user._id,
      groupId: group._id
    });

    res.json({
      success: true,
      data: { group: { ...group.toObject(), contactCount } },
      message: 'Group updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private
 */
export const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Remove group from contacts
    await Contact.updateMany(
      { groupId: req.params.id },
      { $set: { groupId: null } }
    );

    res.json({
      success: true,
      data: {},
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contacts in a group
 * @route   GET /api/groups/:id/contacts
 * @access  Private
 */
export const getGroupContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const group = await Group.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find({
        userId: req.user._id,
        groupId: group._id
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments({
        userId: req.user._id,
        groupId: group._id
      })
    ]);

    res.json({
      success: true,
      data: {
        group: {
          ...group.toObject(),
          contactCount: total
        },
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: 'Group contacts retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add contacts to group
 * @route   POST /api/groups/:id/contacts
 * @access  Private
 */
export const addContactsToGroup = async (req, res, next) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide array of contact IDs'
      });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update contacts
    const result = await Contact.updateMany(
      {
        _id: { $in: contactIds },
        userId: req.user._id
      },
      { $set: { groupId: group._id } }
    );

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount },
      message: `${result.modifiedCount} contacts added to group`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove contacts from group
 * @route   DELETE /api/groups/:id/contacts
 * @access  Private
 */
export const removeContactsFromGroup = async (req, res, next) => {
  try {
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide array of contact IDs'
      });
    }

    const result = await Contact.updateMany(
      {
        _id: { $in: contactIds },
        userId: req.user._id,
        groupId: req.params.id
      },
      { $set: { groupId: null } }
    );

    res.json({
      success: true,
      data: { removedCount: result.modifiedCount },
      message: `${result.modifiedCount} contacts removed from group`
    });
  } catch (error) {
    next(error);
  }
};
