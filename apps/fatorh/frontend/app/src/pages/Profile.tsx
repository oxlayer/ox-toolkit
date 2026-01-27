import { useState } from "react"
import { Plus, Upload, GraduationCap, Edit, Trash2, Calendar, Search } from "lucide-react"
import PageHeader from "@/components/PageHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface AcademicFormation {
    id: number
    course?: string
    degree?: string
    institution?: string
    endDate?: string
}

export default function Profile() {
    const [academicFormations, setAcademicFormations] = useState<AcademicFormation[]>([
        {
            id: 1,
            course: "Administração",
            degree: "Bacharelado",
            institution: "UFRN - UNIVERSIDADE FEDERAL DO RIO GRANDE DO NORTE",
            endDate: "21/08/2027",
        },
    ])
    const [editingFormation, setEditingFormation] = useState<AcademicFormation | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState<AcademicFormation>({
        id: 0,
        course: "",
        degree: "",
        institution: "",
        endDate: "",
    })

    const addFormation = () => {
        setAcademicFormations([...academicFormations, { id: Date.now() }])
    }

    const removeFormation = (id: number) => {
        setAcademicFormations(academicFormations.filter((f) => f.id !== id))
    }

    const openEditModal = (formation: AcademicFormation) => {
        setEditingFormation(formation)
        setEditFormData({
            id: formation.id,
            course: formation.course || "",
            degree: formation.degree || "",
            institution: formation.institution || "",
            endDate: formation.endDate || "",
        })
        setIsEditModalOpen(true)
    }

    const saveFormation = () => {
        if (editingFormation) {
            setAcademicFormations(
                academicFormations.map((f) =>
                    f.id === editingFormation.id ? editFormData : f
                )
            )
        }
        setIsEditModalOpen(false)
        setEditingFormation(null)
    }

    return (
        <div className="w-full p-8 md:p-10 lg:p-12 pb-20">
            <PageHeader title="Perfil" />

            <form className="space-y-8 w-full overflow-x-hidden">
                {/* Dados pessoais */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Dados pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="fullName">Nome completo</Label>
                            <Input id="fullName" placeholder="Bárbara Sarah Peixoto" />
                        </div>
                        <div>
                            <Label htmlFor="socialName">
                                Nome social{" "}
                                <span className="text-gray-500 text-sm font-normal">(Opcional)</span>
                            </Label>
                            <Input
                                id="socialName"
                                placeholder="Digite como você prefere ser chamado"
                            />
                        </div>
                        <div>
                            <Label htmlFor="cpf">CPF</Label>
                            <Input id="cpf" placeholder="314.842.457-33" />
                        </div>
                        <div>
                            <Label htmlFor="rg">
                                RG{" "}
                                <span className="text-gray-500 text-sm font-normal">(Opcional)</span>
                            </Label>
                            <Input id="rg" placeholder="Digite apenas números" />
                        </div>
                        <div>
                            <Label htmlFor="motherName">Nome da mãe</Label>
                            <Input id="motherName" placeholder="Digite o nome completo" />
                        </div>
                        <div>
                            <Label htmlFor="fatherName">
                                Nome do pai{" "}
                                <span className="text-gray-500 text-sm font-normal">(Opcional)</span>
                            </Label>
                            <Input id="fatherName" placeholder="Digite o nome completo" />
                        </div>
                        <div>
                            <Label htmlFor="multiparentalidade">
                                Multiparentalidade{" "}
                                <span className="text-gray-500 text-sm font-normal">(Opcional)</span>
                            </Label>
                            <Input
                                id="multiparentalidade"
                                placeholder="Digite o nome completo"
                            />
                        </div>
                        <div>
                            <Label htmlFor="birthDate">Data de nascimento</Label>
                            <div className="relative">
                                <Input id="birthDate" placeholder="13/01/1998" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="evelyn.carvalho+13@acme.me"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" placeholder="(55) 11111-1111" />
                        </div>
                        <div>
                            <Label htmlFor="professionalLink">
                                Link de perfil profissional{" "}
                                <span className="text-gray-500 text-sm font-normal">(Opcional)</span>
                            </Label>
                            <Input
                                id="professionalLink"
                                placeholder="Digite seu link de perfil profissional"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <Checkbox id="noProfessionalProfile" />
                                <Label
                                    htmlFor="noProfessionalProfile"
                                    className="font-normal cursor-pointer text-sm"
                                >
                                    Não possuo perfil profissional
                                </Label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Endereço */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Endereço</h2>
                    <div className="space-y-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label htmlFor="cep">
                                    CEP{" "}
                                    <span className="text-gray-500 text-sm font-normal">
                                        (Opcional)
                                    </span>
                                </Label>
                                <Input id="cep" placeholder="20261-270" />
                            </div>
                            <Button type="button" variant="outline" className="mb-0">
                                Buscar CEP
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="noCep" />
                            <Label htmlFor="noCep" className="font-normal cursor-pointer text-sm">
                                Não tenho CEP!
                            </Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="state">Estado</Label>
                                <div className="relative">
                                    <Select>
                                        <SelectTrigger id="state">
                                            <SelectValue placeholder="Rio Grande do Norte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rn">Rio Grande do Norte</SelectItem>
                                            <SelectItem value="sp">São Paulo</SelectItem>
                                            <SelectItem value="rj">Rio de Janeiro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="city">Cidade</Label>
                                <div className="relative">
                                    <Select>
                                        <SelectTrigger id="city">
                                            <SelectValue placeholder="Natal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="natal">Natal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="street">Logradouro</Label>
                            <Input id="street" placeholder="Estrada Roquete Pinto" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input id="neighborhood" placeholder="Alto da Boa Vista" />
                            </div>
                            <div>
                                <Label htmlFor="number">Número</Label>
                                <Input id="number" placeholder="28" />
                            </div>
                            <div>
                                <Label htmlFor="complement">
                                    Complemento{" "}
                                    <span className="text-gray-500 text-sm font-normal">
                                        (Opcional)
                                    </span>
                                </Label>
                                <Input id="complement" placeholder="Digite seu complemento" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Diversidade */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Diversidade</h2>
                    <div className="space-y-6">
                        <div>
                            <Label className="mb-3 block">
                                Com qual raça/cor você se identifica?
                            </Label>
                            <RadioGroup defaultValue="" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="amarela" id="amarela" />
                                    <Label htmlFor="amarela" className="font-normal cursor-pointer">
                                        Pessoa amarela
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="branca" id="branca" />
                                    <Label htmlFor="branca" className="font-normal cursor-pointer">
                                        Pessoa branca
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="indigena" id="indigena" />
                                    <Label htmlFor="indigena" className="font-normal cursor-pointer">
                                        Pessoa indígena
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="parda" id="parda" />
                                    <Label htmlFor="parda" className="font-normal cursor-pointer">
                                        Pessoa parda
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="preta" id="preta" />
                                    <Label htmlFor="preta" className="font-normal cursor-pointer">
                                        Pessoa preta
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao-informar-raca" id="nao-informar-raca" />
                                    <Label
                                        htmlFor="nao-informar-raca"
                                        className="font-normal cursor-pointer"
                                    >
                                        Prefiro não informar
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="mb-3 block">
                                Com qual gênero você se identifica?
                            </Label>
                            <RadioGroup defaultValue="mulher-cis" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="agenero" id="agenero" />
                                    <Label htmlFor="agenero" className="font-normal cursor-pointer">
                                        Pessoa agênero
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="genero-fluido" id="genero-fluido" />
                                    <Label
                                        htmlFor="genero-fluido"
                                        className="font-normal cursor-pointer"
                                    >
                                        Pessoa de gênero fluido
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="homem-cis" id="homem-cis" />
                                    <Label htmlFor="homem-cis" className="font-normal cursor-pointer">
                                        Homem cisgênero
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="homem-trans" id="homem-trans" />
                                    <Label
                                        htmlFor="homem-trans"
                                        className="font-normal cursor-pointer"
                                    >
                                        Homem transgênero
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="mulher-cis" id="mulher-cis" />
                                    <Label htmlFor="mulher-cis" className="font-normal cursor-pointer">
                                        Mulher cisgênero
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="mulher-trans" id="mulher-trans" />
                                    <Label
                                        htmlFor="mulher-trans"
                                        className="font-normal cursor-pointer"
                                    >
                                        Mulher transgênero
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao-binaria" id="nao-binaria" />
                                    <Label
                                        htmlFor="nao-binaria"
                                        className="font-normal cursor-pointer"
                                    >
                                        Pessoa não-binária
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao-informar-genero" id="nao-informar-genero" />
                                    <Label
                                        htmlFor="nao-informar-genero"
                                        className="font-normal cursor-pointer"
                                    >
                                        Prefiro não informar
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="outro-genero" id="outro-genero" />
                                    <Label htmlFor="outro-genero" className="font-normal cursor-pointer">
                                        Outro
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="mb-3 block">
                                Qual sua orientação afetivo-sexual?
                            </Label>
                            <RadioGroup defaultValue="" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="assexual" id="assexual" />
                                    <Label htmlFor="assexual" className="font-normal cursor-pointer">
                                        Assexual
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bissexual" id="bissexual" />
                                    <Label htmlFor="bissexual" className="font-normal cursor-pointer">
                                        Bissexual
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="heterossexual" id="heterossexual" />
                                    <Label
                                        htmlFor="heterossexual"
                                        className="font-normal cursor-pointer"
                                    >
                                        Heterossexual
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="homossexual" id="homossexual" />
                                    <Label
                                        htmlFor="homossexual"
                                        className="font-normal cursor-pointer"
                                    >
                                        Homossexual
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pansexual" id="pansexual" />
                                    <Label htmlFor="pansexual" className="font-normal cursor-pointer">
                                        Pansexual
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="outro-orientacao" id="outro-orientacao" />
                                    <Label
                                        htmlFor="outro-orientacao"
                                        className="font-normal cursor-pointer"
                                    >
                                        Outro
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao-informar-orientacao" id="nao-informar-orientacao" />
                                    <Label
                                        htmlFor="nao-informar-orientacao"
                                        className="font-normal cursor-pointer"
                                    >
                                        Prefiro não informar
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label className="mb-3 block">
                                Você é uma pessoa com deficiência?
                            </Label>
                            <RadioGroup defaultValue="nao" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sim" id="sim" />
                                    <Label htmlFor="sim" className="font-normal cursor-pointer">
                                        Sim
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao" id="nao" />
                                    <Label htmlFor="nao" className="font-normal cursor-pointer">
                                        Não
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="nao-informar-deficiencia" id="nao-informar-deficiencia" />
                                    <Label
                                        htmlFor="nao-informar-deficiencia"
                                        className="font-normal cursor-pointer"
                                    >
                                        Prefiro não informar
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label htmlFor="familyIncome">Renda familiar</Label>
                            <Select>
                                <SelectTrigger id="familyIncome">
                                    <SelectValue placeholder="Selecione a média de renda familiar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ate-1">Até 1 salário mínimo</SelectItem>
                                    <SelectItem value="1-2">De 1 a 2 salários mínimos</SelectItem>
                                    <SelectItem value="2-3">De 2 a 3 salários mínimos</SelectItem>
                                    <SelectItem value="3-5">De 3 a 5 salários mínimos</SelectItem>
                                    <SelectItem value="5-10">De 5 a 10 salários mínimos</SelectItem>
                                    <SelectItem value="acima-10">
                                        Acima de 10 salários mínimos
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                {/* Foto de perfil */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Adicione uma foto ao seu perfil
                    </h2>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-yellow-500 rounded-lg p-8 text-center">
                            <Upload className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <label className="cursor-pointer">
                                <span className="text-yellow-500 font-medium">
                                    Escolha uma imagem
                                </span>
                                <input type="file" className="hidden" accept="image/*" />
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                                Formatos aceitos: JPG, PNG, GIF, WebP, etc.
                            </p>
                            <p className="text-sm text-gray-500">
                                Tamanho máximo: 32 MB
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="noPhoto" />
                            <Label htmlFor="noPhoto" className="font-normal cursor-pointer text-sm">
                                Prefiro não adicionar uma foto
                            </Label>
                        </div>
                    </div>
                </section>

                {/* Formação acadêmica */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Formação acadêmica
                        </h2>
                        <p className="text-sm text-gray-600">
                            Conte mais sobre toda a sua trajetória acadêmica. Registre seu curso
                            atual e também os cursos já concluídos.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {academicFormations.map((formation) => (
                            <div
                                key={formation.id}
                                className="border border-gray-200 rounded-lg p-4 flex items-start gap-4"
                            >
                                <GraduationCap className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {formation.course || "Curso não especificado"}
                                        </h3>
                                    </div>
                                    {formation.degree && (
                                        <p className="text-sm text-gray-600 mb-1">
                                            {formation.degree}
                                        </p>
                                    )}
                                    {formation.institution && (
                                        <p className="text-sm text-gray-600 mb-1">
                                            {formation.institution}
                                        </p>
                                    )}
                                    {formation.endDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Data de formação: {formation.endDate}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditModal(formation)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                        onClick={() => removeFormation(formation.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addFormation}
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar formação
                        </Button>
                    </div>
                </section>

                {/* Botão de salvar */}
                <div className="flex justify-end">
                    <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        Salvar alterações
                    </Button>
                </div>
            </form>

            {/* Modal de edição de formação */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-yellow-600 text-2xl">
                            Adicionar formação
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="edit-course">Curso</Label>
                            <p className="text-sm text-gray-500 mb-2">
                                Indique qual curso você estuda
                            </p>
                            <div className="relative">
                                <Select
                                    value={editFormData.course}
                                    onValueChange={(value) =>
                                        setEditFormData({ ...editFormData, course: value })
                                    }
                                >
                                    <SelectTrigger id="edit-course">
                                        <SelectValue placeholder="Escolha um curso" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="administracao">Administração</SelectItem>
                                        <SelectItem value="engenharia-software">
                                            Engenharia de Software
                                        </SelectItem>
                                        <SelectItem value="ciencia-computacao">
                                            Ciência da Computação
                                        </SelectItem>
                                        <SelectItem value="sistemas-informacao">
                                            Sistemas de Informação
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-yellow-600 mt-1">
                                Não encontrou seu curso?{" "}
                                <a href="#" className="underline">
                                    sugira seu curso pra gente
                                </a>
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="edit-institution">Instituição de Ensino</Label>
                            <div className="relative">
                                <Select
                                    value={editFormData.institution}
                                    onValueChange={(value) =>
                                        setEditFormData({ ...editFormData, institution: value })
                                    }
                                >
                                    <SelectTrigger id="edit-institution">
                                        <SelectValue placeholder="Escolha uma instituição" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UFRN - UNIVERSIDADE FEDERAL DO RIO GRANDE DO NORTE">
                                            UFRN - UNIVERSIDADE FEDERAL DO RIO GRANDE DO NORTE
                                        </SelectItem>
                                        <SelectItem value="USP">USP</SelectItem>
                                        <SelectItem value="UNICAMP">UNICAMP</SelectItem>
                                        <SelectItem value="outra">Outra</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-yellow-600 mt-1">
                                Não encontrou sua instituição? Selecione a opção "Outra" e{" "}
                                <a href="#" className="underline">
                                    sugira sua instituição pra gente
                                </a>
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="edit-degree">Grau</Label>
                            <Select
                                value={editFormData.degree}
                                onValueChange={(value) =>
                                    setEditFormData({ ...editFormData, degree: value })
                                }
                            >
                                <SelectTrigger id="edit-degree">
                                    <SelectValue placeholder="Selecione o grau" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bacharelado">Bacharelado</SelectItem>
                                    <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                                    <SelectItem value="Tecnólogo">Tecnólogo</SelectItem>
                                    <SelectItem value="Mestrado">Mestrado</SelectItem>
                                    <SelectItem value="Doutorado">Doutorado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-endDate">Data de término do curso</Label>
                            <div className="relative">
                                <Input
                                    id="edit-endDate"
                                    type="date"
                                    value={editFormData.endDate}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, endDate: e.target.value })
                                    }
                                    placeholder="Selecione a data de término do curso"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Voltar
                        </Button>
                        <Button
                            type="button"
                            onClick={saveFormation}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
