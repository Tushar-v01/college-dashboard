import { auth } from "@/lib/auth-compat";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
};

const ProfilePage = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || !role) {
    return notFound();
  }

  let name = "";
  let img: string | null = null;
  const contactRows: { label: string; value?: string | number | null }[] = [];
  const detailRows: { label: string; value?: string | number | null }[] = [];

  if (role === "admin") {
    const admin = await prisma.admin.findUnique({ where: { id: userId } });
    if (!admin) return notFound();
    name = admin.username;
    detailRows.push({ label: "Username", value: admin.username });
  } else if (role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { id: userId },
      include: { subjects: true, classes: true },
    });
    if (!teacher) return notFound();
    name = `${teacher.name} ${teacher.surname}`;
    img = teacher.img;
    contactRows.push(
      { label: "Email", value: teacher.email },
      { label: "Phone", value: teacher.phone },
      { label: "Address", value: teacher.address },
      { label: "Blood Type", value: teacher.bloodType },
      { label: "Birthday", value: new Intl.DateTimeFormat("en-GB").format(teacher.birthday) }
    );
    detailRows.push(
      { label: "Username", value: teacher.username },
      { label: "Subjects", value: teacher.subjects.map((s) => s.name).join(", ") || "-" },
      { label: "Department (Supervising)", value: teacher.classes.map((c) => c.name).join(", ") || "-" }
    );
  } else if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: { class: true, grade: true, parent: true },
    });
    if (!student) return notFound();
    name = `${student.name} ${student.surname}`;
    img = student.img;
    contactRows.push(
      { label: "Email", value: student.email },
      { label: "Phone", value: student.phone },
      { label: "Address", value: student.address },
      { label: "Blood Type", value: student.bloodType },
      { label: "Birthday", value: new Intl.DateTimeFormat("en-GB").format(student.birthday) }
    );
    detailRows.push(
      { label: "Username", value: student.username },
      { label: "Department", value: student.class?.name },
      { label: "Grade", value: student.grade?.level },
      { label: "Parent", value: student.parent ? `${student.parent.name} ${student.parent.surname}` : "-" }
    );
  } else if (role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: userId },
      include: { students: true },
    });
    if (!parent) return notFound();
    name = `${parent.name} ${parent.surname}`;
    contactRows.push(
      { label: "Email", value: parent.email },
      { label: "Phone", value: parent.phone },
      { label: "Address", value: parent.address }
    );
    detailRows.push(
      { label: "Username", value: parent.username },
      {
        label: "Children",
        value: parent.students.map((s) => `${s.name} ${s.surname}`).join(", ") || "-",
      }
    );
  } else {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* USER INFO CARD */}
      <div className="bg-lamaSky py-6 px-4 rounded-md flex gap-4 items-center">
        {img ? (
          <Image
            src={img}
            alt=""
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-2xl font-semibold text-gray-700">
            {getInitials(name)}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">{name}</h1>
          <span className="text-xs font-medium text-gray-600 bg-white rounded-full px-2 py-1 w-fit capitalize">
            {role}
          </span>
        </div>
      </div>

      {contactRows.length > 0 && (
        <div className="bg-white p-4 rounded-md">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Contact Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {contactRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-md">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {detailRows.map((row) => (
            <DetailRow key={row.label} {...row} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
