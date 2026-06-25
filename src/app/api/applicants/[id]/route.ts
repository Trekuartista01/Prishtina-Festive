import { connectDB } from '@/lib/mongodb';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { isListaAuthenticated, unauthorizedResponse } from '@/lib/lista-auth';
import Applicant from '@/models/Applicant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await isListaAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await context.params;
    await connectDB();

    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return Response.json({ error: 'Aplikanti nuk u gjet.' }, { status: 404 });
    }

    await Promise.allSettled([
      deleteFromCloudinary(applicant.businessCertificatePublicId),
      deleteFromCloudinary(applicant.personalDocumentPublicId),
    ]);

    await applicant.deleteOne();

    return Response.json({ message: 'Aplikanti u fshi me sukses.' });
  } catch (error) {
    console.error('Applicant delete error:', error);
    return Response.json({ error: 'Gabim gjatë fshirjes së aplikantit.' }, { status: 500 });
  }
}
