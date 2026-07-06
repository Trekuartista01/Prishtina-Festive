import { APPLICATIONS_CLOSED_MESSAGE, areApplicationsOpen } from '@/lib/applications';
import { connectDB } from '@/lib/mongodb';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseBase64File } from '@/lib/file-utils';
import Applicant from '@/models/Applicant';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

export async function POST(req: Request) {
  try {
    if (!areApplicationsOpen()) {
      return Response.json({ error: APPLICATIONS_CLOSED_MESSAGE }, { status: 403 });
    }

    const {
      name,
      surname,
      companyName,
      companyEmail,
      businessCertificate,
      businessCertificateName,
      personalDocument,
      personalDocumentName,
      phoneNumber,
      selectedSpace,
    } = await req.json();

    if (
      !name ||
      !companyName ||
      !companyEmail ||
      !phoneNumber ||
      !selectedSpace ||
      !businessCertificate ||
      !personalDocument
    ) {
      return Response.json({ error: 'Të gjitha fushat janë të detyrueshme.' }, { status: 400 });
    }

    const businessFile = parseBase64File(businessCertificate);
    const personalFile = parseBase64File(personalDocument);

    await connectDB();

    const [businessCert, personalDoc] = await Promise.all([
      uploadToCloudinary(
        businessCertificate,
        'prishtina-festive/business-certificates',
        businessCertificateName
      ),
      uploadToCloudinary(
        personalDocument,
        'prishtina-festive/personal-documents',
        personalDocumentName
      ),
    ]);

    const fullName = surname ? `${name} ${surname}` : name;

    const applicant = await Applicant.create({
      name,
      surname: surname || '',
      fullName,
      companyName,
      companyEmail,
      phoneNumber,
      selectedSpace,
      businessCertificateUrl: businessCert.url,
      businessCertificateViewUrl: businessCert.viewUrl,
      businessCertificatePublicId: businessCert.publicId,
      businessCertificateName: businessCert.fileName,
      businessCertificateFile: businessFile.buffer,
      businessCertificateMime: businessFile.mimeType,
      personalDocumentUrl: personalDoc.url,
      personalDocumentViewUrl: personalDoc.viewUrl,
      personalDocumentPublicId: personalDoc.publicId,
      personalDocumentName: personalDoc.fileName,
      personalDocumentFile: personalFile.buffer,
      personalDocumentMime: personalFile.mimeType,
    });

    return Response.json(
      { message: 'Aplikimi u ruajt me sukses.', id: applicant._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Apply error:', error);
    const details = getErrorMessage(error);
    return Response.json(
      { error: 'Gabim gjatë ruajtjes së aplikimit.', details },
      { status: 500 }
    );
  }
}
