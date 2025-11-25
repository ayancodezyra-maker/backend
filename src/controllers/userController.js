// User controller
import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

/* CURSOR PATCH START */
export const getProfile = async (req, res) => {
  try {
    const id = req.user?.id;

    if (!id) {
      return res.status(401).json(formatResponse(false, "User not authenticated", null));
    }

    // Try to get profile with roles join first
    let { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role_code, user_type, phone, avatar_url, created_at, updated_at, roles(name, role_code, type)")
      .eq("id", id)
      .maybeSingle();

    // If join fails, try without roles join
    if (error || !data) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role_code, user_type, phone, avatar_url, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (profileError || !profileData) {
        return res.status(404).json(formatResponse(false, "Profile not found", null));
      }

      data = profileData;
    }

    // Add role_code and user_type to response
    const roleCode = data.roles?.role_code || data.role_code || req.user?.role_code || req.user?.role;
    const userType = data.user_type || (
      roleCode === "SUPER" || roleCode === "ADMIN"
        ? "ADMIN_USER"
        : "APP_USER"
    );

    // Return simplified response
    return res.json(formatResponse(true, "Profile retrieved", {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role_code: roleCode,
      user_type: userType,
      phone: data.phone,
      avatar_url: data.avatar_url,
    }));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const id = req.user?.id;

    if (!id) {
      return res.status(401).json(formatResponse(false, "User not authenticated", null));
    }

    const { full_name, phone, avatar_url } = req.body;

    // Only allow specific fields to be updated
    const updateData = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return res
        .status(400)
        .json(formatResponse(false, "No valid fields to update", null));
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select("id, email, full_name, role_code, user_type, phone, avatar_url")
      .single();

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    if (!data) {
      return res.status(404).json(formatResponse(false, "Profile not found", null));
    }

    return res.json(formatResponse(true, "Profile updated successfully", data));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};
/* CURSOR PATCH END */