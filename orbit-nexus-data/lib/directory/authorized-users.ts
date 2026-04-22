export type AuthorizedDirectoryUser = {
  fullName: string;
  email: string;
  phone?: string;
};

export const leaderDirectoryUsers: AuthorizedDirectoryUser[] = [
  {
    fullName: "Valeria Nathalie Garcia Alvarez",
    email: "valeria.garcia@orbitnexus.local",
    phone: "+525512340101"
  },
  {
    fullName: "Lesslie Parraguirre Escamilla",
    email: "lesslie.parraguirre@orbitnexus.local",
    phone: "+525512340102"
  },
  {
    fullName: "Yahara Ximena Herrera Quezada",
    email: "yahara.herrera@orbitnexus.local",
    phone: "+525512340103"
  },
  {
    fullName: "Paola Danielle Delgado Arzate",
    email: "paola.delgado@orbitnexus.local",
    phone: "+525512340104"
  },
  {
    fullName: "Frida Fonseca Alvarez",
    email: "frida.fonseca@orbitnexus.local",
    phone: "+525512340105"
  },
  {
    fullName: "Amanda Alvarez Santana",
    email: "amanda.alvarez@orbitnexus.local",
    phone: "+525512340106"
  }
];

export const consultantDirectoryUsers: AuthorizedDirectoryUser[] = [
  {
    fullName: "Maricela Fonseca Alvarez",
    email: "maricela.fonseca@orbitnexus.local",
    phone: "+525512340201"
  },
  {
    fullName: "David Saavedra Ponce",
    email: "david.saavedra@orbitnexus.local",
    phone: "+525512340202"
  },
  {
    fullName: "Claudia Jimenez Sanchez",
    email: "claudia.jimenez@orbitnexus.local",
    phone: "+525512340203"
  },
  {
    fullName: "Sofia Jimena Lopez Sanchez",
    email: "sofia.lopez@orbitnexus.local",
    phone: "+525512340204"
  }
];

export const AUTHORIZED_LEADER_NAMES = leaderDirectoryUsers.map((user) => user.fullName);
export const AUTHORIZED_CONSULTANT_NAMES = consultantDirectoryUsers.map(
  (user) => user.fullName
);
