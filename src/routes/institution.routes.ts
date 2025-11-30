import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { authMiddleware } from "../middleware/auth.middleware";
import { InstitutionService } from "../services/institution.service";

const institutionService = new InstitutionService();

export const institutionRoutes = new Elysia({ prefix: "/institutions" })
  .use(
    swagger({
      documentation: {
        tags: [{ name: "Institutions", description: "Kurum yönetimi endpoints" }],
      },
    })
  )
  .use(authMiddleware)

  // GET /institutions - Listele + filtrele
  .get(
    "/",
    async ({ query }) => {
      const list = await institutionService.getAllInstitutions(query);
      console.log("list", list);
      return { success: true, data: list };
    },
    {
      detail: {
        tags: ["Institutions"],
        summary: "Tüm kurumları listele",
        description: "Kayıtlı tüm kurumları filtreleme seçenekleriyle listeler",
      },
      hasRole: ["admin"],
      query: t.Object({
        institution_type: t.Optional(t.String()),
        city: t.Optional(t.String()),
        county: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )

  // GET /institutions/:id - ID'ye göre getir
  .get(
    "/:id",
    async ({ params }) => {
      const institution = await institutionService.getInstitutionById(params.id);
      return { success: true, data: institution };
    },
    {
      detail: {
        tags: ["Institutions"],
        summary: "ID ile kurum getir",
      },
      hasRole: ["admin"],
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // POST /institutions - Yeni kurum oluştur
  .post(
    "/",
    async ({ body, user }) => {

      console.log("institutions");

      const created = await institutionService.createInstitution(body, user?.userId);
      return {
        success: true,
        message: "Institution created successfully",
        data: created,
      };
    },
    {
      detail: {
        tags: ["Institutions"],
        summary: "Yeni kurum oluştur",
      },
      hasRole: ["admin"],
      body: t.Object({
        institution_name: t.String({ minLength: 1, maxLength: 50 }),
        institution_type: t.String(),
        full_name: t.Optional(t.String({ maxLength: 255 })),
        contact_person: t.Optional(t.String({ maxLength: 50 })),
        email: t.Optional(t.String({ format: "email" })),
        phone: t.Optional(t.String({ maxLength: 20 })),
        address: t.Optional(t.String()),
        website: t.Optional(t.String({ maxLength: 50 })),
        city: t.Optional(t.String({ maxLength: 50 })),
        county: t.Optional(t.String({ maxLength: 50 })),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )

  // PUT /institutions/:id - Güncelle
  .put(
    "/:id",
    async ({ params, body, user }) => {
      const updated = await institutionService.updateInstitution(params.id, body, user?.userId);
      return {
        success: true,
        message: "Institution updated successfully",
        data: updated,
      };
    },
    {
      detail: {
        tags: ["Institutions"],
        summary: "Kurum güncelle",
      },
      hasRole: ["admin"],
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        institution_name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        institution_type: t.Optional(t.String()),
        full_name: t.Optional(t.String({ maxLength: 255 })),
        contact_person: t.Optional(t.String({ maxLength: 50 })),
        email: t.Optional(t.String({ format: "email" })),
        phone: t.Optional(t.String({ maxLength: 20 })),
        address: t.Optional(t.String()),
        website: t.Optional(t.String({ maxLength: 50 })),
        city: t.Optional(t.String({ maxLength: 50 })),
        county: t.Optional(t.String({ maxLength: 50 })),
        is_active: t.Optional(t.Boolean()),
      }),
    }
  )

  // DELETE /institutions/:id - Soft Delete
  .delete(
    "/:id",
    async ({ params }) => {
      await institutionService.deleteInstitution(params.id);

      return {
        success: true,
        message: "Institution deleted successfully",
      };
    },
    {
      detail: {
        tags: ["Institutions"],
        summary: "Kurum sil (soft delete)",
      },
      hasRole: ["admin"],
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // POST /institutions/:id/restore
//   .post(
//     "/:id/restore",
//     async ({ params }) => {
//       const restored = await institutionService.restoreInstitutiontore(params.id);
//       return {
//         success: true,
//         message: "Institution restored successfully",
//         data: restored,
//       };
//     },
//     {
//       detail: {
//         tags: ["Institutions"],
//         summary: "Silinen kurumu geri yükle",
//       },
//       hasRole: ["admin"],
//       params: t.Object({
//         id: t.String(),
//       }),
//     }
//   );
